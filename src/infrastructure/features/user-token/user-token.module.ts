import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserTokenOrm } from './typeorm/user-token.orm-entity';
import { UserTokenRepositoryImpl } from './typeorm/user-token.repository.impl';
import { UserTokenService } from 'src/application/user-token/user-token.service';
import { USER_TOKEN_REPOSITORY_TOKEN } from 'src/domain/user-token/user-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserTokenOrm])],
  providers: [
    UserTokenService,
    { provide: USER_TOKEN_REPOSITORY_TOKEN, useClass: UserTokenRepositoryImpl },
  ],
  exports: [UserTokenService],
})
export class UserTokenModule {}
