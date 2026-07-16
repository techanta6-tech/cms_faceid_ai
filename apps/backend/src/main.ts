import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Nạp các biến môi trường từ file .env.development nếu tồn tại, ngược lại dùng .env
const devEnvPath = path.join(__dirname, '..', '.env.development');
const envPath = fs.existsSync(devEnvPath) ? devEnvPath : path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
