import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { AppConfigModule } from '../config/app-config.module';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';
import { MailService } from 'src/application/mail/mail.service';

export function getTemplateDir(): string {
  const srcDir = join(
    process.cwd(),
    'src',
    'infrastructure',
    'mail',
    'templates',
  );
  const distDir = join(__dirname, 'templates');
  return process.env.NODE_ENV === 'production' ? distDir : srcDir;
}

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppEnvConfigService],
      useFactory: (config: AppEnvConfigService) => ({
        transport: {
          host: config.smtpMailHost, // from your .env via AppEnvConfigService
          port: config.smtpMailPort, // numeric
          secure: config.smtpMailSecure ?? false, // optional TLS toggle
          auth: config.smtpMailUser
            ? {
                // if you need auth:
                user: config.smtpMailUser,
                pass: config.smtpMailPassword,
              }
            : undefined,
        },
        defaults: {
          from: config.smtpMailFrom,
        },
        template: {
          dir: getTemplateDir(),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
