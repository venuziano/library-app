import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLError } from 'graphql';

import { AuthorModule } from './modules/author.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { InfrastructureCacheModule } from './infrastructure/cache/cache.module';
import { CacheModule } from './modules/cache.module';
import { LoggingModule } from './infrastructure/logging/logging.module';

const gqlLogger: Logger = new Logger('GraphQL');

@Module({
  imports: [
    // Config modules
    DatabaseModule,

    // Structure and monitoring modules
    InfrastructureCacheModule,
    LoggingModule,

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // automatically generate schema.gql next to your compiled code:
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      path: '/graphql',
      // new Apollo Sandbox landing page
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          /* other options? */
        }),
      ],
      formatError: (error: GraphQLError) => {
        const exception = error.extensions?.exception as Error | undefined;
        const trace = exception?.stack;

        gqlLogger.error(`Validation error: ${error.message}`, trace, 'GraphQL');
        return error;
      },
    }),

    // Application modules
    AuthorModule,
    CacheModule,
  ],
})
export class AppModule {}
