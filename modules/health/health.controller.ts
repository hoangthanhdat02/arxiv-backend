import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check and API server liveness' })
  @ApiResponse({ status: 200, description: 'Server is healthy and responding.' })
  check() {
    return {
      status: 'ok',
      service: 'arxiv-discovery-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
