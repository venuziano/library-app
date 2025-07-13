import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailDeliveryFailedError } from 'src/domain/mail/mail-error';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendVerificationEmail(
    to: string,
    username: string,
    code: string,
  ): Promise<void> {
    try {
      // throw new Error('🔬 Simulated email send failure sendVerificationEmail');
      const confirmationUrl = `https://yourapp.com/verify?code=${code}`;
      await this.mailer.sendMail({
        to,
        subject: 'Confirm your email',
        template: 'verification', // name of the .hbs file (without extension)
        context: {
          // values to replace in template
          username,
          confirmationUrl,
        },
      });
    } catch (err: any) {
      throw new EmailDeliveryFailedError('verification', to, err.message);
    }
  }

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    try {
      // throw new Error('🔬 Simulated email send failure sendWelcomeEmail');
      await this.mailer.sendMail({
        to,
        subject: 'Welcome aboard!',
        template: 'welcome',
        context: { username },
      });
    } catch (err: any) {
      throw new EmailDeliveryFailedError('welcome', to, err.message);
    }
  }
}
