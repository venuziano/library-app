import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';
import { UserService } from '../user/user.service';
import { UserTokenService } from '../user-token/user-token.service';
import { EmailGateway } from 'src/domain/interfaces/email.gateway';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dtos/register.dto';
import { User } from 'src/domain/user/user.entity';
import { TokenType } from 'src/domain/user-token/token-type.enum';
import { JwtPayload } from 'src/domain/auth/jwt-payload.interface';
import { EmailDeliveryFailedError } from 'src/domain/mail/mail-error';

@Injectable()
export class UserRegistrationService {
  constructor(
    private readonly hasher: BcryptPasswordHasher,
    private readonly userService: UserService,
    private readonly userTokenService: UserTokenService,
    private readonly emailGateway: EmailGateway,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

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
      const verificationCode: string = await this.userTokenService.createToken(
        saved,
        TokenType.EMAIL_VERIFICATION,
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
    await this.emailGateway.enqueueVerification(
      result.user.email,
      result.user.username,
      result.verificationCode,
    );

    return { accessToken: result.token };
  }
}
