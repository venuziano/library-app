import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MailerModule } from '@nestjs-modules/mailer';
import { HealthModule } from './health.module';
import { BullHealthIndicator } from './bull-health.indicator';

// Mock Bull Health Indicator
const mockBullHealthIndicator = {
  isHealthy: jest.fn().mockResolvedValue({
    queue: {
      status: 'up',
      details: {
        connectivity: 'up',
        queueState: 'up',
        processorHealth: 'up',
        jobProcessing: 'up',
      },
    },
  }),
};

describe('HealthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MailerModule.forRoot({
          transport: {
            streamTransport: true,
            newline: 'unix',
            buffer: true,
          },
        }),
        HealthModule,
      ],
    })
      .overrideProvider(BullHealthIndicator)
      .useValue(mockBullHealthIndicator)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health/ping (GET)', async () => {
    await request(app.getHttpServer())
      .get('/health/ping')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/health/mail (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/mail')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.details.mail.status).toBe('up');
  });

  it('/health/queue (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/queue')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.details.queue.status).toBe('up');
    expect(res.body.details.queue.details).toMatchObject({
      connectivity: 'up',
      queueState: 'up',
      processorHealth: 'up',
      jobProcessing: 'up',
    });
  });
});
