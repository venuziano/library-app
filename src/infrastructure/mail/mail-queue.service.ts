import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { EmailGateway } from 'src/domain/interfaces/email.gateway';
import {
  MAIL_PROCESS_TOKEN,
  SEND_VERIFICATION_PROCESS_TOKEN,
  SEND_WELCOME_PROCESS_TOKEN,
} from 'src/application/jobs/email-jobs';

@Injectable()
export class MailQueueService implements EmailGateway {
  constructor(
    @InjectQueue(MAIL_PROCESS_TOKEN) private readonly mailQueue: Queue,
  ) {}

  async enqueueVerification(
    to: string,
    username: string,
    code: string,
  ): Promise<void> {
    await this.mailQueue.add(
      SEND_VERIFICATION_PROCESS_TOKEN,
      { to, username, code },
      { attempts: 5, backoff: { type: 'fixed', delay: 1000 } },
    );
  }

  async enqueueWelcome(to: string, username: string): Promise<void> {
    await this.mailQueue.add(
      SEND_WELCOME_PROCESS_TOKEN,
      { to, username },
      { attempts: 3, backoff: { type: 'fixed', delay: 500 } },
    );
  }
}
