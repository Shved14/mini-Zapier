import { Controller, All, Req, Res, UseGuards, Headers } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProxyService } from './proxy.service';

@ApiTags('proxy')
@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('workflows*')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to workflow service' })
  async proxyWorkflow(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    return this.proxyService.proxyRequest(req, res, 'workflow', headers);
  }

  @All('executions*')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to execution service' })
  async proxyExecution(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    return this.proxyService.proxyRequest(req, res, 'execution', headers);
  }

  @All('triggers*')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to trigger service' })
  async proxyTrigger(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    return this.proxyService.proxyRequest(req, res, 'trigger', headers);
  }

  @All('actions*')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to action service' })
  async proxyAction(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    return this.proxyService.proxyRequest(req, res, 'action', headers);
  }

  @All('notifications*')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to notification service' })
  async proxyNotification(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    return this.proxyService.proxyRequest(req, res, 'notification', headers);
  }

  @All('users*')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to auth service' })
  async proxyAuth(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    return this.proxyService.proxyRequest(req, res, 'auth', headers);
  }
}
