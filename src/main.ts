import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@bull-board/express';
import { MAIL_PROCESS_TOKEN } from './domain/interfaces/email.gateway';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';

import { AppEnvConfigService } from './infrastructure/config/environment-variables/app-env.config';
import { INestApplication } from '@nestjs/common';

/**
 * Mounts Bull-Board on your Nest app under `mountPath`
 * for the given queue tokens.
 */
export function registerBullBoard(
  app: INestApplication,
  mountPath: string,
  queueTokens: string[],
) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(mountPath);

  const adapters = queueTokens.map((token) => {
    const q = app.get<Queue>(getQueueToken(token));
    return new BullAdapter(q);
  });

  createBullBoard({ queues: adapters, serverAdapter });
  app.use(mountPath, serverAdapter.getRouter());
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const env: AppEnvConfigService = app.get(AppEnvConfigService);

  registerBullBoard(app, '/queues', [MAIL_PROCESS_TOKEN]);

  await app.listen(env.apiPort ?? 3010);
}

void bootstrap();
