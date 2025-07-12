import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';

import { MailService } from './mail.service';
import {
  MAIL_PROCESS_TOKEN,
  SEND_VERIFICATION_PROCESS_TOKEN,
  SEND_WELCOME_PROCESS_TOKEN,
} from 'src/domain/interfaces/email.gateway';

@Processor(MAIL_PROCESS_TOKEN)
export class MailProcessor {
  constructor(private readonly emailService: MailService) {}

  @Process(SEND_VERIFICATION_PROCESS_TOKEN)
  async handleVerification(
    job: Job<{ to: string; username: string; code: string }>,
  ) {
    const { to, username, code } = job.data;
    return this.emailService.sendVerificationEmail(to, username, code);
  }

  @Process(SEND_WELCOME_PROCESS_TOKEN)
  async handleWelcome(job: Job<{ to: string; username: string }>) {
    const { to, username } = job.data;
    return this.emailService.sendWelcomeEmail(to, username);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    if (job.attemptsMade === job.opts.attempts) {
      console.error(
        `✉️ Permanently failed ${job.name} to ${job.data.to}:`,
        err,
      );
      // e.g. alert ops here
    }
  }
}
