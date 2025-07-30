import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';

@Injectable()
export class RedisCheckService implements OnModuleInit {
  private readonly logger = new Logger(RedisCheckService.name);
  private client: RedisClientType;

  constructor(private readonly config: AppEnvConfigService) {}

  async onModuleInit() {
    const url: string = this.config.redisURL;
    console.log('url', url);
    this.client = createClient({ url });
    this.client.on('error', (err: unknown) => {
      if (err instanceof Error) {
        this.logger.error('Redis client error', err.stack);
      } else {
        this.logger.error('Redis client error', String(err));
      }
    });

    try {
      await this.client.connect();
      const pong = await this.client.ping();
      console.log('pong', pong);
      if (pong === 'PONG') {
        this.logger.log('✅ Successfully connected to Redis');
      } else {
        this.logger.error(`❌ Unexpected PING response: ${pong}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          `❌ Redis healthcheck failed: ${err.message}`,
          err.stack,
        );
      } else {
        this.logger.error(`❌ Redis healthcheck failed: ${String(err)}`);
      }
    }
  }

  /** expose the raw client */
  getClient() {
    return this.client;
  }
}
