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

  private async createVerificationToken(
    user: User,
    manager?: EntityManager,
  ): Promise<string> {
    const verificationCode: string = randomBytes(32).toString('hex');

    await this.userTokenService.create(
      {
        userId: user.id!,
        tokenType: TokenType.EMAIL_VERIFICATION,
        code: verificationCode,
      },
      manager,
    );

    return verificationCode;
  }

  private async sendVerificationEmail(
    user: User,
    verificationCode: string,
  ): Promise<void> {
    await this.mailService.sendVerificationEmail(
      user.email,
      user.username,
      verificationCode,
    );
  }

  async signUp(registerDto: RegisterDto): Promise<{ accessToken: string }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const hashed: string = await this.hasher.hash(registerDto.password);

      const newUser: User = User.create({
        username: registerDto.username,
        email: registerDto.email,
        password: hashed,
        firstname: registerDto.firstname,
        lastname: registerDto.lastname,
      });

      const saved: User = await this.userService.create(newUser, manager);

      // Generate verification token within transaction
      const verificationCode: string = await this.createVerificationToken(
        saved,
        manager,
      );

      const payload: JwtPayload = {
        sub: saved.id!.toString(),
        username: saved.username,
      };
      const token = this.jwtService.sign(payload);

      return { user: saved, token, verificationCode };
    });

    // retry if fail to send email
    await this.sendVerificationEmail(result.user, result.verificationCode);

    return { accessToken: result.token };
  }

  async verifyEmail(code: string): Promise<{ message: string }> {
    const token: UserToken | null =
      await this.userTokenService.findByCode(code);

    if (!token) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (token.tokenType !== TokenType.EMAIL_VERIFICATION) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (token.isConsumed()) {
      throw new UnauthorizedException('Verification code already used');
    }

    // If token is expired, resend a new verification code
    if (token.isExpired()) {
      const user = await this.userService.findById(token.userId);

      // Delete the expired token
      await this.userTokenService.delete(token.id!);

      // Create a new verification token
      const newVerificationCode = await this.createVerificationToken(user);

      await this.sendVerificationEmail(user, newVerificationCode);

      return {
        message:
          'Verification code has expired. A new verification code has been sent to your email.',
      };
    }

    // Mark token as consumed
    token.consume();
    await this.userTokenService.update({
      id: token.id!,
      userId: token.userId,
      tokenType: token.tokenType,
      code: token.code,
      consumedAt: token.consumedAt as Date,
    });

    // send welcome message/account verified
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
