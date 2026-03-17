import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from './auth/auth.module';
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

    // Passport for OAuth
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Database and cache
    PrismaModule,
    RedisModule,

    // Logging
    WinstonModule.forRoot({
      level: 'info',
      format: require('winston').format.combine(
        require('winston').format.timestamp(),
        require('winston').format.errors({ stack: true }),
        require('winston').format.json(),
      ),
      defaultMeta: { service: 'auth-service' },
      transports: [
        new require('winston').transports.File({ filename: 'error.log', level: 'error' }),
        new require('winston').transports.File({ filename: 'combined.log' }),
      ],
    }),

    // Auth module
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }
