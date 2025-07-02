import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLError } from 'graphql';

import { AuthorModule } from './infrastructure/features/author/author.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { InfrastructureCacheModule } from './infrastructure/cache/cache.module';
import { CacheModule } from './modules/cache.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { CategoryModule } from './infrastructure/features/category/category.module';
import { SharedModule } from './infrastructure/features/entity-checker/entity-checker.module';
import { BookModule } from './infrastructure/features/book/book.module';

const gqlLogger: Logger = new Logger('GraphQL');

@Module({
  imports: [
    // Config modules
    DatabaseModule,

    // Structure and monitoring modules
    InfrastructureCacheModule,
    LoggingModule,
    SharedModule,

    GraphQLModule.forRoot({
      driver: ApolloDriver,
      // automatically generate schema.gql next to your compiled code:
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'prod',
      path: '/graphql',
      dateScalarMode: 'isoDate',
      // Apollo Sandbox landing page
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          /* other options? */
        }),
      ],
      formatError: (error: GraphQLError) => {
        const path = error.path?.join('.') ?? 'unknownPath';
        const locs =
          (error.locations ?? [])
            .map(({ line, column }) => `${line}:${column}`)
            .join(', ') || 'unknownLoc';

        gqlLogger.error(
          `ValidationError on "${path}" at [${locs}]: ${error.message}`,
        );
        return error;
      },
    }),

    // Application modules
    AuthorModule,
    CategoryModule,
    CacheModule,
    BookModule,
  ],
})
export class AppModule {}
