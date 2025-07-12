/* eslint-disable @typescript-eslint/no-require-imports */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import basicAuth = require('express-basic-auth');
import { INestApplication } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

import { AppEnvConfigService } from './infrastructure/config/environment-variables/app-env.config';
import { MAIL_PROCESS_TOKEN } from './application/jobs/email-jobs';

/**
 * Mounts Bull-Board on your Nest app under `mountPath`
 * for the given queue tokens.
 */
export function registerBullBoard(
  app: INestApplication,
  mountPath: string,
  queueTokens: string[],
  env: AppEnvConfigService,
): void {
  const serverAdapter: ExpressAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(mountPath);

  const adapters: BullAdapter[] = queueTokens.map((token) => {
    const q = app.get<Queue>(getQueueToken(token));
    return new BullAdapter(q);
  });

  createBullBoard({ queues: adapters, serverAdapter });
  app.use(
    mountPath,
    rateLimit({
      windowMs: 200 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 50 requests per window
      standardHeaders: true, // return rate limit info in `RateLimit-*` headers
      legacyHeaders: false,
    }),
    basicAuth({
      users: { [env.bullUser]: env.bullPassword },
      challenge: true,
    }),
    serverAdapter.getRouter(),
  );
}

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);

  const env: AppEnvConfigService = app.get(AppEnvConfigService);

  registerBullBoard(app, '/queues', [MAIL_PROCESS_TOKEN], env);

  await app.listen(env.apiPort ?? 3010);
}

void bootstrap();
