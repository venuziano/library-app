import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrm } from './typeorm/user.orm-entity';
import { UserRepositoryImpl } from './typeorm/user.repository.impl';
import { UserService } from 'src/application/user/user.service';
import { UserResolver } from './graphql/user.resolver';
import { EntityChecker } from 'src/application/shared/entity-checker.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrm])],
  providers: [
    UserService,
    { provide: 'UserRepository', useClass: UserRepositoryImpl },
    UserResolver,
    EntityChecker,
  ],
  exports: [UserService],
})
export class UserModule {}
