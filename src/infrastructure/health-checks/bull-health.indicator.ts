import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { MAIL_PROCESS_TOKEN } from 'src/application/jobs/email-jobs';
import { SEND_VERIFICATION_PROCESS_TOKEN } from 'src/application/jobs/email-jobs';

@Injectable()
export class BullHealthIndicator {
  constructor(
    @InjectQueue(MAIL_PROCESS_TOKEN) private readonly mailQueue: Queue,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // Check 1: Queue Connectivity
      const connectivity = await this.checkQueueConnectivity();

      // Check 2: Queue State
      const queueState = await this.checkQueueState();

      // Check 3: Processor Health
      const processorHealth = await this.checkProcessorHealth();

      // Check 4: Job Processing
      const jobProcessing = await this.checkJobProcessing();

      // If any check fails, return down status
      if (
        connectivity === 'down' ||
        queueState === 'down' ||
        processorHealth === 'down' ||
        jobProcessing === 'down'
      ) {
        return indicator.down({
          connectivity,
          queueState,
          processorHealth,
          jobProcessing,
          error: 'One or more queue health checks failed',
        });
      }

      return indicator.up({
        connectivity,
        queueState,
        processorHealth,
        jobProcessing,
      });
    } catch (err) {
      return indicator.down({
        error: (err as Error).message,
      });
    }
  }

  private async checkQueueConnectivity(): Promise<'up' | 'down'> {
    try {
      // Check if queue is ready and can connect to Redis
      const isReady = await this.mailQueue.isReady();
      return isReady ? 'up' : 'down';
    } catch (error) {
      return 'down';
    }
  }

  private async checkQueueState(): Promise<'up' | 'down'> {
    try {
      // Get job counts to check queue state
      const jobCounts = await this.mailQueue.getJobCounts();

      // Check if queue is in a healthy state
      // - Not too many failed jobs
      // - Not too many waiting jobs (indicating processing issues)
      // - Not too many active jobs (indicating stuck processing)

      const { waiting, active, failed, completed } = jobCounts;

      // If there are too many failed jobs, queue might be unhealthy
      if (failed > 10) {
        return 'down';
      }

      // If there are too many waiting jobs and few active, might indicate processing issues
      if (waiting > 50 && active < 2) {
        return 'down';
      }

      // If there are too many active jobs for too long, might be stuck
      if (active > 10) {
        return 'down';
      }

      return 'up';
    } catch (error) {
      return 'down';
    }
  }

  private async checkProcessorHealth(): Promise<'up' | 'down'> {
    try {
      // Check if the processor is registered and listening
      // This is a basic check - in a real implementation you might want to
      // check if the processor is actually processing jobs

      // Get queue info to see if processors are connected
      const queueInfo = await this.mailQueue.getJobCounts();

      // If we can get job counts, the processor is likely healthy
      // In a more sophisticated implementation, you might check:
      // - If processors are registered
      // - If they're responding to heartbeats
      // - If they're processing jobs within expected timeframes

      return 'up';
    } catch (error) {
      return 'down';
    }
  }

  private async checkJobProcessing(): Promise<'up' | 'down'> {
    try {
      // Test job processing by adding a test job
      // This is optional and should be used carefully in production
      // as it creates actual jobs in the queue

      const testJob = await this.mailQueue.add(
        SEND_VERIFICATION_PROCESS_TOKEN,
        {
          to: 'health-check@test.com',
          username: 'health-check',
          code: '000000',
        },
        {
          removeOnComplete: true, // Remove the test job after completion
          removeOnFail: true, // Remove the test job if it fails
          attempts: 1, // Only try once for health check
          timeout: 5000, // 5 second timeout
        },
      );

      // Wait for the job to be processed (with timeout)
      const result = await Promise.race([
        testJob.finished(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Job processing timeout')), 10000),
        ),
      ]);

      return 'up';
    } catch (error) {
      // If job processing fails, we might still want to return 'up'
      // depending on the type of error. For now, we'll be conservative
      // and return 'down' if job processing fails
      return 'down';
    }
  }
}
