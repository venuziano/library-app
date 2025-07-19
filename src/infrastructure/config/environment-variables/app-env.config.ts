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
    return this.configService.getOrThrow<string>('DB_USER');
  }

  get dbName(): string {
    return this.configService.getOrThrow<string>('DATABASE');
  }

  get dbPassword(): string {
    return this.configService.getOrThrow<string>('DB_PASSWORD');
  }

  get redisURL(): string {
    return this.configService.getOrThrow<string>('REDIS_URL');
  }

  get bullUser(): string {
    return this.configService.getOrThrow<string>('BB_USER');
  }

  get bullPassword(): string {
    return this.configService.getOrThrow<string>('BB_PASS');
  }

  get redisHost(): string {
    return this.configService.getOrThrow<string>('REDIS_HOST');
  }

  get redisPort(): number {
    return this.configService.getOrThrow<number>('REDIS_PORT');
  }

  get cacheTTLL1(): number {
    return this.configService.getOrThrow<number>('CACHE_TTL_L1', 10);
  }

  get cacheTTLL2(): number {
    return this.configService.getOrThrow<number>('CACHE_TTL_L2', 120);
  }

  get nodeEnv(): string {
    return this.configService.getOrThrow<string>('NODE_ENV');
  }

  get jwtSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.configService.getOrThrow<string>('JWT_EXPIRES_IN', '1h');
  }

  get smtpMailHost(): string {
    return this.configService.getOrThrow<string>('MAIL_HOST');
  }

  get smtpMailPort(): number {
    return this.configService.getOrThrow<number>('MAIL_PORT');
  }

  get smtpMailSecure(): boolean {
    return this.configService.getOrThrow<boolean>('MAIL_SECURE');
  }

  get smtpMailUser(): string {
    return this.configService.getOrThrow<string>('MAIL_USER', '');
  }

  get smtpMailPassword(): string {
    return this.configService.getOrThrow<string>('MAIL_PASSWORD', '');
  }

  get smtpMailFrom(): string {
    return this.configService.getOrThrow<string>('MAIL_FROM', 'No Reply');
  }
}
