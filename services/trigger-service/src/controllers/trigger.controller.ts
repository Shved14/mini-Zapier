import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TriggerService } from '../services/trigger.service';

export interface CreateTriggerDto {
  name: string;
  type: 'webhook' | 'cron' | 'email' | 'manual';
  config: Record<string, any>;
  workflowId: string;
}

export interface TriggerDto {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  workflowId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Controller()
export class TriggerController {
  constructor(private readonly triggerService: TriggerService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'trigger-service', timestamp: new Date().toISOString() };
  }

  @Post()
  async createTrigger(@Body() createTriggerDto: CreateTriggerDto) {
    try {
      const trigger = await this.triggerService.createTrigger(createTriggerDto);
      return { success: true, trigger };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getTriggers(): Promise<TriggerDto[]> {
    return this.triggerService.getTriggers();
  }

  @Get(':id')
  async getTrigger(@Body('id') id: string): Promise<TriggerDto> {
    try {
      return await this.triggerService.getTrigger(id);
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post(':id/activate')
  async activateTrigger(@Body('id') id: string) {
    try {
      await this.triggerService.activateTrigger(id);
      return { success: true, message: 'Trigger activated' };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/deactivate')
  async deactivateTrigger(@Body('id') id: string) {
    try {
      await this.triggerService.deactivateTrigger(id);
      return { success: true, message: 'Trigger deactivated' };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('webhook/:webhookId')
  async handleWebhook(@Body('webhookId') webhookId: string, @Body() payload: any) {
    try {
      const result = await this.triggerService.handleWebhook(webhookId, payload);
      return { success: true, result };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('types')
  getTriggerTypes() {
    return this.triggerService.getTriggerTypes();
  }
}
