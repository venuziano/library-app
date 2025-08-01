import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { EmailGateway } from 'src/domain/interfaces/email.gateway';
import { MailProcessor } from '../mail/mail-processor';
import { MailModule } from '../mail/mail.module';
import { MailQueueService } from '../mail/mail-queue.service';
import { AppConfigModule } from '../config/app-config.module';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';
import { MAIL_PROCESS_TOKEN } from 'src/application/jobs/email-jobs';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppEnvConfigService],
      useFactory: (config: AppEnvConfigService) => {
        const common = {
          host: config.redisHost,
          port: Number(config.redisPort),
        };

        return {
          redis:
            config.nodeEnv === 'prod'
              ? {
                  ...common,
                  tls: { rejectUnauthorized: false },
                }
              : common,
        };
      },
    }),
    // registers ONE Redis-backed queue named "mail"
    BullModule.registerQueue({ name: MAIL_PROCESS_TOKEN }),
    MailModule,
  ],
  providers: [
    // the concrete implementation binds the EmailGateway API to Bull
    { provide: EmailGateway, useClass: MailQueueService },
    MailProcessor,
  ],
  exports: [EmailGateway, BullModule],
})
export class QueueModule {}
