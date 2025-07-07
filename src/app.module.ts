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

@Module({
  imports: [
    // Infra
    DatabaseModule,
    InfrastructureCacheModule,
    LoggingModule,
    EntityCheckerModule,
    MailModule,
    HealthModule,

    // Transport
    GraphqlConfigModule,
    // GraphQLModule.forRoot({
    //   driver: ApolloDriver,
    //   // automatically generate schema.gql next to your compiled code:
    //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    //   playground: false,
    //   includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'prod',
    //   path: '/graphql',
    //   dateScalarMode: 'isoDate',
    //   // Apollo Sandbox landing page
    //   plugins: [
    //     ApolloServerPluginLandingPageLocalDefault({
    //       /* other options? */
    //     }),
    //   ],
    //   formatError: (error: GraphQLError) => {
    //     const path = error.path?.join('.') ?? 'unknownPath';
    //     const locs =
    //       (error.locations ?? [])
    //         .map(({ line, column }) => `${line}:${column}`)
    //         .join(', ') || 'unknownLoc';

    //     gqlLogger.error(
    //       `ValidationError on "${path}" at [${locs}]: ${error.message}`,
    //     );
    //     return error;
    //   },
    // }),

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
