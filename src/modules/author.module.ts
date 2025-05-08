import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthorOrm } from '../infrastructure/typeorm/author/author.orm-entity';
import { AuthorRepositoryImpl } from '../infrastructure/typeorm/author/author.repository.impl';
import { AuthorService } from '../application/author/author.service';
import { AuthorResolver } from '../infrastructure/graphql/author/author.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorOrm])],
  providers: [
    AuthorService,
    { provide: 'AuthorRepository', useClass: AuthorRepositoryImpl },
    AuthorResolver,
  ],
})
export class AuthorModule {}
