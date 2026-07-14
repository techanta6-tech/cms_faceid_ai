import { Controller, Get, Query, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { existsSync, createReadStream } from 'fs';

@Controller('media')
export class MediaController {
  @Get()
  async getMedia(@Query('path') filePath: string, @Res() res: Response) {
    if (!filePath) {
      throw new NotFoundException('Không tìm thấy đường dẫn ảnh');
    }
    
    // Normalize path to handle Windows forward/backward slashes
    const normalizedPath = filePath.replace(/\//g, '\\');
    
    let finalPath = normalizedPath;
    const localPrefix = process.env.IMAGE_LOCAL_PATH;
    const mountPrefix = process.env.IMAGE_MOUNT_PATH;

    if (localPrefix && mountPrefix && normalizedPath.toLowerCase().startsWith(localPrefix.toLowerCase())) {
      const relativePath = normalizedPath.substring(localPrefix.length);
      finalPath = (mountPrefix + relativePath).replace(/\\/g, '/');
    }
    
    if (!existsSync(finalPath)) {
      throw new NotFoundException('Không tìm thấy file ảnh trên đĩa');
    }
    
    // Determine content type
    let contentType = 'image/jpeg';
    const lowerPath = finalPath.toLowerCase();
    if (lowerPath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (lowerPath.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (lowerPath.endsWith('.webp')) {
      contentType = 'image/webp';
    }
    
    res.setHeader('Content-Type', contentType);
    const fileStream = createReadStream(finalPath);
    fileStream.pipe(res);
  }
}
