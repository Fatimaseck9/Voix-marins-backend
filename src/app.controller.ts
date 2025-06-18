import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  @Get('test-uploads')
  testUploads() {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    try {
      const exists = fs.existsSync(uploadsDir);
      const files = exists ? fs.readdirSync(uploadsDir) : [];
      
      return {
        message: 'Test des fichiers uploads',
        uploadsDir,
        dirExists: exists,
        fileCount: files.length,
        sampleFiles: files.slice(0, 10), // Premiers 10 fichiers
        cwd: process.cwd(),
        __dirname: __dirname
      };
    } catch (error) {
      return {
        error: 'Erreur lors du test',
        details: error.message,
        cwd: process.cwd()
      };
    }
  }
}
