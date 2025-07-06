import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';

import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';
import { UserService } from '../user/user.service';
import { UserTokenService } from '../user-token/user-token.service';
import { UserToken } from 'src/domain/user-token/user-token.entity';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtPayload } from 'src/domain/auth/jwt-payload.interface';
import { User } from 'src/domain/user/user.entity';
import { MailService } from '../mail/mail.service';
import { TokenType } from 'src/domain/user-token/token-type.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hasher: BcryptPasswordHasher,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly userTokenService: UserTokenService,
  ) {}

  async signUp(registerDto: RegisterDto): Promise<{ accessToken: string }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const hashed = await this.hasher.hash(registerDto.password);

      const newUser = User.create({
        username: registerDto.username,
        email: registerDto.email,
        password: hashed,
        firstname: registerDto.firstname,
        lastname: registerDto.lastname,
      });

      const saved = await this.userService.create(newUser, manager);

      // Generate verification token
      const verificationCode = randomBytes(32).toString('hex');

      await this.userTokenService.create(
        {
          userId: saved.id!,
          tokenType: TokenType.EMAIL_VERIFICATION,
          code: verificationCode,
        },
        manager,
      );

      const payload: JwtPayload = {
        sub: saved.id!.toString(),
        username: saved.username,
      };
      const token = this.jwtService.sign(payload);

      return { user: saved, token, verificationCode };
    });

    await this.mailService.sendVerificationEmail(
      result.user.email,
      result.user.username,
      result.verificationCode,
    );

    //retry failed emails
    return { accessToken: result.token };
  }

  async verifyEmail(code: string): Promise<{ message: string }> {
    const token = await this.userTokenService.findByCode(code);

    if (!token) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (token.tokenType !== TokenType.EMAIL_VERIFICATION) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (token.isExpired()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    if (token.isVerified()) {
      throw new UnauthorizedException('Email already verified');
    }

    if (token.isConsumed()) {
      throw new UnauthorizedException('Verification code already used');
    }

    token.verify();
    await this.userTokenService.update({
      id: token.id!,
      userId: token.userId,
      tokenType: token.tokenType,
      code: token.code,
    });

    return { message: 'Email verified successfully' };
  }

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
