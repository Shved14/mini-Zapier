import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../config/prisma.service';
import { RedisService } from '../config/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

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
        service: { type: 'string', example: 'auth-service' },
        version: { type: 'string', example: '1.0.0' },
        database: { type: 'string', example: 'connected' },
        redis: { type: 'string', example: 'connected' },
      },
    },
  })
  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
      database: 'unknown',
      redis: 'unknown',
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
      // Check Redis connection
      await this.redis.set('health_check', 'ok');
      await this.redis.del('health_check');
      health.redis = 'connected';
    } catch (error) {
      health.redis = 'disconnected';
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
      
      // Check Redis
      await this.redis.set('ready_check', 'ok');
      await this.redis.del('ready_check');

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error('Service not ready');
    }
  }
}
