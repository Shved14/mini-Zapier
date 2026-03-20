import { Module } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'action-service', timestamp: new Date().toISOString() };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
