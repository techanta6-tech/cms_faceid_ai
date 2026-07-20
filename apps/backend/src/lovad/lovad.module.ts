import { Module } from '@nestjs/common';
import { LovadIntegrationService } from './lovad-integration.service';
import { LovadController } from './lovad.controller';

@Module({
  controllers: [LovadController],
  providers: [LovadIntegrationService],
  exports: [LovadIntegrationService],
})
export class LovadModule {}
