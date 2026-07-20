import { Controller, Get, Post, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { LovadIntegrationService } from './lovad-integration.service';

@Controller('lovad')
export class LovadController {
  constructor(private readonly lovadService: LovadIntegrationService) {}

  @Get('status')
  getStatus() {
    return this.lovadService.getStatus();
  }

  @Get('events')
  getEvents() {
    return this.lovadService.getEvents();
  }

  @Get('stream/:cameraId')
  getStreamUrl(@Param('cameraId') cameraId: string) {
    return this.lovadService.getStreamUrl(cameraId);
  }

  @Post('reconnect')
  @HttpCode(HttpStatus.OK)
  async reconnect() {
    return await this.lovadService.forceReconnect();
  }

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  clearEvents() {
    this.lovadService.clearEvents();
    return { message: 'RAM events cleared' };
  }
}
