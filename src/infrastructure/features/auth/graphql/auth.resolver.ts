import { Resolver, Mutation, Args } from '@nestjs/graphql';

import { AuthService } from 'src/application/auth/auth.service';
import { RegisterInput } from './types/register.input';
import { LoginInput } from './types/login.input';
import { VerifyEmailInput } from './types/verify-email.input';
import { UserRegistrationService } from 'src/application/auth/user-register.service';
import { UserVerificationService } from 'src/application/auth/user-verification.service';
import { MessageGQL } from 'src/infrastructure/graphql/shared/message-payload-return.graphql-types';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly registerService: UserRegistrationService,
    private readonly verifyService: UserVerificationService,
  ) {}

  @Mutation(() => MessageGQL)
  async register(@Args('input') input: RegisterInput): Promise<MessageGQL> {
    const { message } = await this.registerService.signUp(input);
    return { message };
  }

  @Mutation(() => MessageGQL)
  async verifyEmail(
    @Args('input') input: VerifyEmailInput,
  ): Promise<MessageGQL> {
    const result = await this.verifyService.verifyEmail(input.code);
    return result;
  }

  // @Mutation(() => AuthPayload)
  // async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
  //   const { accessToken } = await this.authService.signIn(input);
  //   return { accessToken };
  // }
}
