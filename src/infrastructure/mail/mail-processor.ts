import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';

import { MailService } from './mail.service';
import {
  MAIL_PROCESS_TOKEN,
  SEND_VERIFICATION_PROCESS_TOKEN,
  SEND_WELCOME_PROCESS_TOKEN,
  IVerificationJobData,
  IWelcomeJobData,
} from 'src/application/jobs/email-jobs';

@Processor(MAIL_PROCESS_TOKEN)
export class MailProcessor {
  constructor(private readonly emailService: MailService) {}

  @Process(SEND_VERIFICATION_PROCESS_TOKEN)
  async handleVerification(job: Job<IVerificationJobData>) {
    const { to, username, code } = job.data;
    return this.emailService.sendVerificationEmail(to, username, code);
  }

  @Process(SEND_WELCOME_PROCESS_TOKEN)
  async handleWelcome(job: Job<IWelcomeJobData>) {
    const { to, username } = job.data;
    return this.emailService.sendWelcomeEmail(to, username);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    console.error(`✉️ Permanently failed ${job.name} to ${job.data.to}:`, err);
  }
}
