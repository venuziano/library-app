import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthorOrm } from './typeorm/author.orm-entity';
import { AuthorRepositoryImpl } from './typeorm/author.repository.impl';
import { AuthorService } from '../../../application/author/author.service';
import { EntityChecker } from 'src/application/shared/entity-checker.service';
import { AuthorResolver } from './graphql/author.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorOrm])],
  providers: [
    AuthorService,
    { provide: 'AuthorRepository', useClass: AuthorRepositoryImpl },
    AuthorResolver,
    EntityChecker,
  ],
  exports: [AuthorService],
})
export class AuthorModule {}
