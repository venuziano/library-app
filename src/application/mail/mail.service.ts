import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendVerificationEmail(to: string, username: string, token: string) {
    const confirmationUrl = `https://yourapp.com/confirm?token=${token}`;
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

  async sendWelcomeEmail(to: string, username: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Welcome aboard!',
      template: 'welcome',
      context: { username },
    });
  }
}
