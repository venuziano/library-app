import { Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Global()
@Injectable()
export class AppEnvConfigService {
  constructor(private configService: ConfigService) {}

  get apiPort(): number {
    return this.configService.getOrThrow<number>('API_PORT', 3010);
  }

  get pgDBType(): string {
    return this.configService.getOrThrow<string>('PG_TYPE', 'postgres');
  }

  get dbHost(): string {
    return this.configService.getOrThrow<string>(
      'HOST',
      'host.docker.internal',
    );
  }

  get pgDBPort(): number {
    return this.configService.getOrThrow<number>('PG_PORT', 5432);
  }

  get dbUsername(): string {
    return this.configService.getOrThrow<string>('USERNAME');
  }

  get dbName(): string {
    return this.configService.getOrThrow<string>('DATABASE');
  }

  get dbPassword(): string {
    return this.configService.getOrThrow<string>('PASSWORD');
  }

  get redisURL(): string {
    return this.configService.getOrThrow<string>(
      'REDIS_URL',
      'redis://redis:6379',
    );
  }

  get cacheTTLL1(): number {
    return this.configService.getOrThrow<number>('CACHE_TTL_L1', 10);
  }

  get cacheTTLL2(): number {
    return this.configService.getOrThrow<number>('CACHE_TTL_L2', 120);
  }
}
