import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [HttpModule],
  controllers: [ProxyController],
  providers: [ProxyService, ConfigService],
  exports: [ProxyService],
})
export class ProxyModule {}
