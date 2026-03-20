import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';

export interface Trigger {
  id: string;
  name: string;
  type: 'webhook' | 'cron' | 'email' | 'manual';
  config: Record<string, any>;
  workflowId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class TriggerService {
  private triggers: Map<string, Trigger> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    // Initialize with some example triggers
    this.initializeTriggers();
  }

  private initializeTriggers() {
    // This would normally load from database
    const exampleTrigger: Trigger = {
      id: '1',
      name: 'Example Webhook Trigger',
      type: 'webhook',
      config: { webhookId: 'webhook-123' },
      workflowId: 'workflow-1',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.triggers.set(exampleTrigger.id, exampleTrigger);
  }

  async createTrigger(triggerData: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Trigger> {
    const trigger: Trigger = {
      ...triggerData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false,
    };

    this.triggers.set(trigger.id, trigger);

    if (trigger.isActive) {
      await this.activateTrigger(trigger.id);
    }

    return trigger;
  }

  async getTriggers(): Promise<Trigger[]> {
    return Array.from(this.triggers.values());
  }

  async getTrigger(id: string): Promise<Trigger> {
    const trigger = this.triggers.get(id);
    if (!trigger) {
      throw new Error('Trigger not found');
    }
    return trigger;
  }

  async activateTrigger(id: string): Promise<void> {
    const trigger = this.triggers.get(id);
    if (!trigger) {
      throw new Error('Trigger not found');
    }

    if (trigger.isActive) {
      return; // Already active
    }

    switch (trigger.type) {
      case 'cron':
        this.activateCronTrigger(trigger);
        break;
      case 'webhook':
        // Webhook triggers are always listening
        break;
      case 'email':
        // Email triggers would require setting up email monitoring
        break;
      case 'manual':
        // Manual triggers don't need activation
        break;
    }

    trigger.isActive = true;
    trigger.updatedAt = new Date().toISOString();
  }

  async deactivateTrigger(id: string): Promise<void> {
    const trigger = this.triggers.get(id);
    if (!trigger) {
      throw new Error('Trigger not found');
    }

    if (!trigger.isActive) {
      return; // Already inactive
    }

    if (trigger.type === 'cron') {
      const job = this.cronJobs.get(id);
      if (job) {
        job.stop();
        this.cronJobs.delete(id);
      }
    }

    trigger.isActive = false;
    trigger.updatedAt = new Date().toISOString();
  }

  async handleWebhook(webhookId: string, payload: any): Promise<TriggerResult> {
    // Find trigger by webhook ID
    const trigger = Array.from(this.triggers.values()).find(
      t => t.type === 'webhook' && t.config.webhookId === webhookId && t.isActive
    );

    if (!trigger) {
      throw new Error('Webhook trigger not found or inactive');
    }

    // Here you would normally trigger the workflow execution
    console.log(`Triggering workflow ${trigger.workflowId} with payload:`, payload);

    return {
      success: true,
      data: {
        workflowId: trigger.workflowId,
        payload,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private activateCronTrigger(trigger: Trigger): void {
    const { cronExpression } = trigger.config;
    if (!cronExpression) {
      throw new Error('Cron expression required for cron triggers');
    }

    const job = cron.schedule(cronExpression, () => {
      console.log(`Cron trigger ${trigger.id} fired, triggering workflow ${trigger.workflowId}`);
      // Here you would normally trigger the workflow execution
    }, {
      scheduled: true,
    });

    this.cronJobs.set(trigger.id, job);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getTriggerTypes() {
    return [
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'Trigger workflow via HTTP webhook',
        configSchema: {
          webhookId: { type: 'string', required: true },
        },
      },
      {
        type: 'cron',
        name: 'Scheduled',
        description: 'Trigger workflow on a schedule',
        configSchema: {
          cronExpression: { type: 'string', required: true },
        },
      },
      {
        type: 'email',
        name: 'Email',
        description: 'Trigger workflow when email is received',
        configSchema: {
          email: { type: 'string', required: true },
          subject: { type: 'string' },
        },
      },
      {
        type: 'manual',
        name: 'Manual',
        description: 'Manually trigger workflow',
        configSchema: {},
      },
    ];
  }
}
