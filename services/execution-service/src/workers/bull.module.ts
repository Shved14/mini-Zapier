import { Module } from '@nestjs/common';
import { BullModule as NestBullModule } from '@nestjs/bull';
import { WorkflowProcessor } from './workflow.processor';
import { WorkflowExecutionService } from '../execution/workflow-execution.service';
import { PrismaModule } from '../config/prisma.module';

@Module({
  imports: [
    NestBullModule.registerQueue({
      name: 'workflow-execution',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  providers: [WorkflowProcessor],
  exports: [NestBullModule],
})
export class BullQueueModule { }
