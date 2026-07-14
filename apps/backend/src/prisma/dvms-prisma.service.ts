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
    await this.$connect();
  }
}
