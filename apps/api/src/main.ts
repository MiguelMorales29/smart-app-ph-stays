import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { validateEnv } from './env.js';

async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  const origins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: origins,
  });

  app.useBodyParser('json', { limit: '100kb' });
  app.enableShutdownHooks();

  await app.listen(env.PORT);
}

void bootstrap();
