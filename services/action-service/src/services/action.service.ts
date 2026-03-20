import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class ActionService {
  async executeAction(type: string, config: Record<string, any>, input: Record<string, any>): Promise<ActionResult> {
    switch (type) {
      case 'http':
        return this.executeHttpAction(config, input);
      case 'email':
        return this.executeEmailAction(config, input);
      case 'telegram':
        return this.executeTelegramAction(config, input);
      case 'database':
        return this.executeDatabaseAction(config, input);
      case 'transform':
        return this.executeTransformAction(config, input);
      default:
        return { success: false, error: `Unknown action type: ${type}` };
    }
  }

  private async executeHttpAction(config: Record<string, any>, input: Record<string, any>): Promise<ActionResult> {
    try {
      const { url, method = 'POST', headers = {}, body } = config;
      const processedBody = this.replaceVariables(body, input);

      const response = await axios({
        url,
        method,
        headers,
        data: processedBody,
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async executeEmailAction(config: Record<string, any>, input: Record<string, any>): Promise<ActionResult> {
    try {
      const { to, subject, body, smtp } = config;
      const transporter = nodemailer.createTransport(smtp);

      const processedSubject = this.replaceVariables(subject, input);
      const processedBody = this.replaceVariables(body, input);

      await transporter.sendMail({
        to,
        subject: processedSubject,
        text: processedBody,
      });

      return { success: true, data: { message: 'Email sent successfully' } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async executeTelegramAction(config: Record<string, any>, input: Record<string, any>): Promise<ActionResult> {
    try {
      const { botToken, chatId, message } = config;
      const bot = new TelegramBot(botToken);

      const processedMessage = this.replaceVariables(message, input);

      await bot.sendMessage(chatId, processedMessage);

      return { success: true, data: { message: 'Telegram message sent successfully' } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async executeDatabaseAction(config: Record<string, any>, input: Record<string, any>): Promise<ActionResult> {
    // This is a placeholder for database actions
    // In a real implementation, you would connect to different databases based on config
    return { success: true, data: { message: 'Database action executed', config, input } };
  }

  private async executeTransformAction(config: Record<string, any>, input: Record<string, any>): Promise<ActionResult> {
    try {
      const { transformation } = config;
      let result = input;

      // Simple placeholder for data transformation
      if (transformation.type === 'map') {
        result = this.applyMapping(result, transformation.mapping);
      } else if (transformation.type === 'filter') {
        result = this.applyFilter(result, transformation.filter);
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    if (!template) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  private applyMapping(data: any, mapping: Record<string, string>): any {
    const result = {};
    for (const [targetKey, sourceKey] of Object.entries(mapping)) {
      result[targetKey] = data[sourceKey];
    }
    return result;
  }

  private applyFilter(data: any, filter: any): any {
    // Simple filter implementation
    return data;
  }

  getAvailableActions() {
    return [
      {
        type: 'http',
        name: 'HTTP Request',
        description: 'Make HTTP requests to external APIs',
        configSchema: {
          url: { type: 'string', required: true },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
          headers: { type: 'object' },
          body: { type: 'any' },
        },
      },
      {
        type: 'email',
        name: 'Send Email',
        description: 'Send emails via SMTP',
        configSchema: {
          to: { type: 'string', required: true },
          subject: { type: 'string', required: true },
          body: { type: 'string', required: true },
          smtp: { type: 'object', required: true },
        },
      },
      {
        type: 'telegram',
        name: 'Send Telegram Message',
        description: 'Send messages via Telegram bot',
        configSchema: {
          botToken: { type: 'string', required: true },
          chatId: { type: 'string', required: true },
          message: { type: 'string', required: true },
        },
      },
      {
        type: 'database',
        name: 'Database Operation',
        description: 'Perform database operations',
        configSchema: {
          type: { type: 'string', enum: ['select', 'insert', 'update', 'delete'], required: true },
          connection: { type: 'object', required: true },
          query: { type: 'string' },
        },
      },
      {
        type: 'transform',
        name: 'Transform Data',
        description: 'Transform and map data',
        configSchema: {
          transformation: { type: 'object', required: true },
        },
      },
    ];
  }
}
