import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ExecutionController } from './execution.controller';
import { WorkflowExecutionService } from './workflow-execution.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule,
  ],
  controllers: [ExecutionController],
  providers: [WorkflowExecutionService, JwtAuthGuard],
  exports: [WorkflowExecutionService, JwtAuthGuard],
})
export class ExecutionModule {}
