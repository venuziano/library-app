import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MailerModule } from '@nestjs-modules/mailer';
import { HealthModule } from './health.module';

describe('HealthController (e2e)', () => {
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
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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
});
