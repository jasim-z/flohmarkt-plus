import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Controller()
export class HealthController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('metrics')
  async metricsEndpoint(@Res() res: Response) {
    res.setHeader('Content-Type', this.metrics.getRegistry().contentType);
    res.send(await this.metrics.getRegistry().metrics());
  }
}

