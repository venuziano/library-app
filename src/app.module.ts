import { Module } from '@nestjs/common';

import { AuthorModule } from './infrastructure/features/author/author.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { InfrastructureCacheModule } from './infrastructure/cache/cache.module';
import { CacheModule } from './modules/cache.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { CategoryModule } from './infrastructure/features/category/category.module';
import { EntityCheckerModule } from './infrastructure/features/entity-checker/entity-checker.module';
import { BookModule } from './infrastructure/features/book/book.module';
import { UserModule } from './infrastructure/features/user/user.module';
import { AuthModule } from './infrastructure/features/auth/auth.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { HealthModule } from './infrastructure/health-checks/health.module';
import { GraphqlConfigModule } from './infrastructure/graphql/graphql.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { EventModule } from './infrastructure/event/event.module';

@Module({
  imports: [
    // Infra
    DatabaseModule,
    InfrastructureCacheModule,
    LoggingModule,
    EntityCheckerModule,
    MailModule,
    HealthModule,
    QueueModule,
    EventModule,

    // Transport
    GraphqlConfigModule,

    // Domains
    AuthorModule,
    CategoryModule,
    CacheModule,
    BookModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
