import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

import { AuthorModule } from './modules/author.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      driver: ApolloDriver,
      // automatically generate schema.gql next to your compiled code:
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      path: '/graphql',
      // new Apollo Sandbox landing page
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          /* options? */
        }),
      ],
    }),

    // Application modules
    AuthorModule,

    // Config modules
    DatabaseModule,
  ],
})
export class AppModule {}
