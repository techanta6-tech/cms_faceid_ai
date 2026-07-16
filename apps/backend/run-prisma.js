const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Nạp các biến môi trường từ .env.development nếu tồn tại, ngược lại dùng .env
const devEnvPath = path.join(__dirname, '.env.development');
const envPath = fs.existsSync(devEnvPath) ? devEnvPath : path.join(__dirname, '.env');
dotenv.config({ path: envPath });

// Lấy các đối số truyền vào script
const args = process.argv.slice(2);

// Đường dẫn tới Prisma CLI binary
const prismaCliPath = path.join(__dirname, '../../node_modules/prisma/build/index.js');

// Chạy Prisma CLI với các biến môi trường vừa nạp
const result = spawnSync('node', [prismaCliPath, ...args], {
  stdio: 'inherit',
  shell: false,
  env: process.env
});

process.exit(result.status);
