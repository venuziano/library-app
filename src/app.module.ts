import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

import { AuthorModule } from './modules/author.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { InfrastructureCacheModule } from './infrastructure/cache/cache.module';
import { CacheModule } from './modules/cache.module';

@Module({
  imports: [
    // Config modules
    DatabaseModule,

    InfrastructureCacheModule,

    GraphQLModule.forRoot<ApolloDriverConfig>({
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
    CacheModule,
  ],
})
export class AppModule {}
