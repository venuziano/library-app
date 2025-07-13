import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager } from 'typeorm';
import { randomBytes } from 'crypto';

import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';
import { UserService } from '../user/user.service';
import { UserTokenService } from '../user-token/user-token.service';
import { UserToken } from 'src/domain/user-token/user-token.entity';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtPayload } from 'src/domain/auth/jwt-payload.interface';
import { User } from 'src/domain/user/user.entity';
import { TokenType } from 'src/domain/user-token/token-type.enum';
import { EmailGateway } from 'src/domain/interfaces/email.gateway';
import { EmailDeliveryFailedError } from 'src/domain/mail/mail-error';

@Injectable()
export class AuthService {
  constructor() {} // private readonly emailGateway: EmailGateway, // private readonly userTokenService: UserTokenService, // private readonly dataSource: DataSource, // private readonly hasher: BcryptPasswordHasher, // private readonly jwtService: JwtService, // private readonly userService: UserService,

  // async signIn(loginDto: LoginDto): Promise<{ accessToken: string }> {
  //   const user = await this.userService.findByEmail(loginDto.email);
  //   if (!user) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }

  //   const passwordMatches = await this.hasher.compare(
  //     loginDto.password,
  //     user.password,
  //   );
  //   if (!passwordMatches) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }

  //   const payload: JwtPayload = {
  //     sub: user.id!.toString(),
  //     username: user.username,
  //     // roles: user.roles,
  //   };

  //   const accessToken = this.jwtService.sign(payload);
  //   return { accessToken };
  // }
}
