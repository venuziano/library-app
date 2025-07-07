import { Module, Logger } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLError } from 'graphql';

const gqlLogger = new Logger('GraphQL');

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'prod',
      path: '/graphql',
      dateScalarMode: 'isoDate',
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      formatError: (error: GraphQLError) => {
        const path = error.path?.join('.') ?? 'unknownPath';
        const locs =
          (error.locations ?? [])
            .map(({ line, column }) => `${line}:${column}`)
            .join(',') || 'unknownLoc';

        gqlLogger.error(
          `ValidationError on "${path}" at [${locs}]: ${error.message}`,
        );
        return error;
      },
    }),
  ],
  exports: [GraphQLModule],
})
export class GraphqlConfigModule {}
