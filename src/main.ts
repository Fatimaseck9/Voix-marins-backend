import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { SmsService } from './sms/sms.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration des fichiers statiques avec chemin absolu
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log('Chemin du dossier uploads:', uploadsPath);
  
  app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, path) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, HEAD');
      res.set('Access-Control-Allow-Headers', 'Range, Accept');
      res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
      res.set('Cache-Control', 'public, max-age=3600');
    }
  }));
  
  // Configuration CORS unifiée
  app.enableCors({
    origin: '*',
    //['http://r8ks00ks8k88ksscg8g8cocw.92.113.25.175.sslip.io ', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Middleware pour gérer les requêtes OPTIONS
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  await app.listen(process.env.PORT || 3001);

  const smsService = app.get(SmsService);
  try {
    console.log('Tentative de récupération du quota SMS...');
    const quota = await smsService.getRemainingSmsQuota();
    console.log('Quota restant de SMS :', quota);
  } catch (error) {
    console.error('Erreur lors de la récupération du quota SMS:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

void bootstrap();