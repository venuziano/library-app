import { Resolver, Mutation, Args } from '@nestjs/graphql';

import { AuthService } from 'src/application/auth/auth.service';
import { AuthPayload } from './types/auth-payload.gql';
import { RegisterInput } from './types/register.input';
import { LoginInput } from './types/login.input';
import { VerifyEmailInput } from './types/verify-email.input';
import { VerifyEmailPayload } from './types/verify-email-payload.gql';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    const { accessToken } = await this.authService.signUp(input);
    return { accessToken };
  }

  @Mutation(() => VerifyEmailPayload)
  async verifyEmail(@Args('input') input: VerifyEmailInput): Promise<VerifyEmailPayload> {
    const result = await this.authService.verifyEmail(input.code);
    return result;
  }

  // @Mutation(() => AuthPayload)
  // async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
  //   const { accessToken } = await this.authService.signIn(input);
  //   return { accessToken };
  // }
}
