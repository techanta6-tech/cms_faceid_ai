import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/lcms';

@Injectable()
export class LcmsPrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.LCMS_DATABASE_URL || 'postgresql://postgres:@localhost:5433/lcms_server?connect_timeout=15&pooling=true&minpoolsize=0&maxpoolsize=200',
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[LcmsPrismaService] Connected to LCMS Database successfully');
    } catch (error: any) {
      console.error('[LcmsPrismaService] Failed to connect to LCMS Database:', error?.message || error);
    }
  }
}
