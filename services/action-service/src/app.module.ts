import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { ActionController } from './controllers/action.controller';
import { ActionService } from './services/action.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
  ],
  controllers: [ActionController],
  providers: [ActionService],
})
export class AppModule {}
