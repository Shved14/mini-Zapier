import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ActionService } from '../services/action.service';

export interface ExecuteActionDto {
  type: 'http' | 'email' | 'telegram' | 'database' | 'transform';
  config: Record<string, any>;
  input?: Record<string, any>;
}

@Controller()
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'action-service', timestamp: new Date().toISOString() };
  }

  @Post('execute')
  async executeAction(@Body() executeActionDto: ExecuteActionDto) {
    try {
      const result = await this.actionService.executeAction(
        executeActionDto.type,
        executeActionDto.config,
        executeActionDto.input || {}
      );
      return { success: true, result };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('actions')
  getAvailableActions() {
    return this.actionService.getAvailableActions();
  }
}
