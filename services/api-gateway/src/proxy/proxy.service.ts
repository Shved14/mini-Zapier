import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { ConfigService } from '../config/config.service';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  async proxyRequest(req: Request, res: Response, serviceName: string, headers: any) {
    try {
      const serviceUrl = this.configService.services[serviceName];
      if (!serviceUrl) {
        return res.status(502).json({ message: `Service ${serviceName} not found` });
      }

      const targetUrl = `${serviceUrl}${req.originalUrl}`;

      // Remove host header to avoid conflicts
      const { host, ...forwardHeaders } = headers;

      // Add authorization header if present
      if (req.headers.authorization) {
        forwardHeaders.authorization = req.headers.authorization;
      }

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url: targetUrl,
          headers: forwardHeaders,
          data: req.body,
          params: req.query,
        }),
      );

      return res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
