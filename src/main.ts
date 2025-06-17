import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { SmsService } from './sms/sms.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration des fichiers statiques avec options
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads'), {
    setHeaders: (res, path) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, HEAD');
      res.set('Access-Control-Allow-Headers', 'Range, Accept');
      res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
      res.set('Cache-Control', 'public, max-age=3600');
    }
  }));
  
  app.enableCors({
    origin: 'https://6851789c5982c800087e13f6--strong-druid-9db0b1.netlify.app', 
    //['http://localhost:4200', 'http://localhost:4204','https://521a-154-124-68-191.ngrok-free.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'Range', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Type'],
    //credentials: true,
    maxAge: 3600,
  });

  // Middleware pour gérer les headers ngrok et augmenter le timeout
  app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    res.setTimeout(300000); // 5 minutes timeout
  next();
});

  await app.listen(3001);

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
