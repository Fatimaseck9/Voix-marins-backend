import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { SmsService } from './sms/sms.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration CORS plus permissive
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Middleware pour gérer les en-têtes CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With, Origin, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Access-Control-Allow-Methods');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Configuration de la validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Configuration des fichiers statiques
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Augmenter le timeout à 5 minutes
  app.use((req, res, next) => {
    res.setTimeout(300000, () => {
      console.log('Request has timed out.');
      res.status(408).send('Request has timed out.');
    });
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
