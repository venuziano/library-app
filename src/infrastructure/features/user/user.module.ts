import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrm } from './typeorm/user.orm-entity';
import { UserRepositoryImpl } from './typeorm/user.repository.impl';
import { UserService } from 'src/application/user/user.service';
import { UserResolver } from './graphql/user.resolver';
import { EntityChecker } from 'src/application/shared/entity-checker.service';
import { USER_REPOSITORY_TOKEN } from 'src/domain/user/user.repository';
import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrm])],
  providers: [
    UserService,
    BcryptPasswordHasher,
    { provide: USER_REPOSITORY_TOKEN, useClass: UserRepositoryImpl },
    UserResolver,
    EntityChecker,
  ],
  exports: [UserService],
})
export class UserModule {}
