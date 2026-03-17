import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './config/prisma.module';
import { WinstonModule } from 'nest-winston';
import { WorkflowModule } from './workflow/workflow.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '1h',
        },
      }),
      inject: [ConfigService],
      global: true,
    }),

    // Database
    PrismaModule,

    // Logging
    WinstonModule.forRoot({
      level: 'info',
      format: require('winston').format.combine(
        require('winston').format.timestamp(),
        require('winston').format.errors({ stack: true }),
        require('winston').format.json(),
      ),
      defaultMeta: { service: 'workflow-service' },
      transports: [
        new require('winston').transports.File({ filename: 'error.log', level: 'error' }),
        new require('winston').transports.File({ filename: 'combined.log' }),
      ],
    }),

    // Workflow module
    WorkflowModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
