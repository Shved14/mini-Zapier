import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { TriggerController } from './controllers/trigger.controller';
import { TriggerService } from './services/trigger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
  ],
  controllers: [TriggerController],
  providers: [TriggerService],
})
export class AppModule {}
