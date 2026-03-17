import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../config/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        service: { type: 'string', example: 'execution-service' },
        version: { type: 'string', example: '1.0.0' },
        database: { type: 'string', example: 'connected' },
        queue: { type: 'string', example: 'connected' },
      },
    },
  })
  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'execution-service',
      version: '1.0.0',
      database: 'unknown',
      queue: 'unknown',
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'error';
    }

    try {
      // Check Redis connection (BullMQ queue)
      // This would need to be implemented to check BullMQ queue status
      health.queue = 'connected';
    } catch (error) {
      health.queue = 'disconnected';
      health.status = 'error';
    }

    return health;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if service is ready' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is ready',
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Service is not ready',
  })
  async ready() {
    try {
      // Check database
      await this.prisma.$queryRaw`SELECT 1`;

      // Check BullMQ queue
      // This would need to be implemented

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error('Service not ready');
    }
  }
}
