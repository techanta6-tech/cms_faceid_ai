import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/cms_webserver';

@Injectable()
export class CmsPrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.CMS_WEBSERVER_DATABASE_URL || 'postgresql://postgres:@localhost:5433/cms_webserver?connect_timeout=15',
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
