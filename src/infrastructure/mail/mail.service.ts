import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendVerificationEmail(
    to: string,
    username: string,
    code: string,
  ): Promise<void> {
    // throw new Error('🔬 Simulated email send failure');
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
  }

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    // throw new Error('🔬 Simulated email send failure 1');
    await this.mailer.sendMail({
      to,
      subject: 'Welcome aboard!',
      template: 'welcome',
      context: { username },
    });
  }
}
