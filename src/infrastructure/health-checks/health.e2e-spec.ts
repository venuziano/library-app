import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { HealthModule } from './health.module';
import { MailModule } from '../mail/mail.module';
import { QueueModule } from '../queue/queue.module';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';

describe('HealthController (e2e with real SMTP)', () => {
  let app: INestApplication;
  let mailhog: StartedTestContainer;

  beforeAll(async () => {
    // start MailHog in Docker
    mailhog = await new GenericContainer('mailhog/mailhog')
      .withExposedPorts(1025, 8025)
      .start();

    const smtpHost = mailhog.getHost();
    const smtpPort = mailhog.getMappedPort(1025);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MailModule, // uses AppEnvConfigService under the hood
        QueueModule, // provide Bull queue for BullHealthIndicator
        HealthModule, // controller + indicator
      ],
    })
      .overrideProvider(AppEnvConfigService)
      .useValue({
        smtpMailHost: smtpHost,
        smtpMailPort: smtpPort,
        smtpMailSecure: false,
        smtpMailUser: undefined,
        smtpMailPassword: undefined,
        smtpMailFrom: 'test@localhost',
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60_000);

  afterAll(async () => {
    if (app) await app.close();
    if (mailhog) await mailhog.stop();
  });

  it('/health/ping (GET) should return 200', () =>
    request(app.getHttpServer())
      .get('/health/ping')
      .expect(200)
      .expect({ status: 'ok' }));

  it('/health/mail (GET) should report smtp up', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/mail')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.details.mail.status).toBe('up');
  });

  it('/health/mail (GET) after MailHog stops should report smtp down', async () => {
    // stop MailHog so no SMTP listener remains
    await mailhog.stop();

    // small delay to ensure Docker has torn down the listener
    await new Promise((r) => setTimeout(r, 100));

    const res = await request(app.getHttpServer())
      .get('/health/mail')
      .expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(res.body.status).toBe('error');
    expect(res.body.details.mail.status).toBe('down');
    expect(res.body.details.mail.error).toMatch(/ECONNREFUSED/);
  });
});
