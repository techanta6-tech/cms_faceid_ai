import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/dvms';

@Injectable()
export class DvmsPrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DVMS_DATABASE_URL || 'postgresql://postgres:@localhost:5433/dvms_server?connect_timeout=15',
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[DvmsPrismaService] Connected to DVMS Database successfully');
    } catch (error: any) {
      console.error('[DvmsPrismaService] Failed to connect to DVMS Database:', error?.message || error);
    }
  }
}
