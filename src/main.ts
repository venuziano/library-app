import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { AppEnvConfigService } from './infrastructure/config/environment-variables/app-env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const env: AppEnvConfigService = app.get(AppEnvConfigService);

  await app.listen(env.apiPort ?? 3010);
}

void bootstrap();
