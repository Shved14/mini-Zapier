import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get port(): number {
    return parseInt(process.env.PORT, 10) || 3000;
  }

  get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3007';
  }

  get redisUrl(): string {
    return process.env.REDIS_URL || 'redis://localhost:6379';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'your-secret-key';
  }

  get jwtExpiration(): string {
    return process.env.JWT_EXPIRATION || '24h';
  }

  get services(): Record<string, string> {
    return {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      workflow: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:3002',
      execution: process.env.EXECUTION_SERVICE_URL || 'http://localhost:3003',
      trigger: process.env.TRIGGER_SERVICE_URL || 'http://localhost:3004',
      action: process.env.ACTION_SERVICE_URL || 'http://localhost:3005',
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    };
  }

  get oauth(): {
    google: { clientId: string; clientSecret: string };
    github: { clientId: string; clientSecret: string };
  } {
    return {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      },
    };
  }
}
