import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { UserService } from '../user/user.service';
import { UserTokenService } from '../user-token/user-token.service';
import { TokenType } from 'src/domain/user-token/token-type.enum';
import { UserToken } from 'src/domain/user-token/user-token.entity';
import { MessageDto } from '../shared/dtos/message.dto';
import { UserEmailVerified } from 'src/domain/events/user/user-verified.event';
import { UserRegistered } from 'src/domain/events/user/user-registered.event';

@Injectable()
export class UserVerificationService {
  constructor(
    private readonly userService: UserService,
    private readonly userTokenService: UserTokenService,
    private readonly eventBus: EventBus,
  ) {}

  async verifyEmail(code: string): Promise<MessageDto> {
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

    const user = await this.userService.findById(token.userId);

    // If token is expired, resend a new verification code
    if (token.isExpired()) {
      // Delete the expired token
      await this.userTokenService.delete(token.id as number);

      // Create a new verification token
      const newVerificationCode = await this.userTokenService.createToken(
        user,
        TokenType.EMAIL_VERIFICATION,
      );

      // emit event to send verification email if old expired
      this.eventBus.publish(
        new UserRegistered(
          user.id!,
          user.email,
          user.username,
          newVerificationCode,
        ),
      );

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
    this.eventBus.publish(
      new UserEmailVerified(user.id!, user.email, user.username),
    );

    return { message: 'Email verified successfully' };
  }
}
