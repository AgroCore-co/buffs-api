import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../modules/auth/guards/auth.guard';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-09-17T10:30:00.000Z' },
        service: { type: 'string', example: 'BUFFS API' },
        version: { type: 'string', example: '1.0.0' },
        uptime: { type: 'number', example: 3600 },
        environment: { type: 'string', example: 'production' },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'BUFFS API',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001,
    };
  }

  @Get('detailed')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detailed health check with system info' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  checkDetailed() {
    const memoryUsage = process.memoryUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'BUFFS API',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'running',
        database: 'supabase_configured',
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
        },
      },
    };
  }
}
