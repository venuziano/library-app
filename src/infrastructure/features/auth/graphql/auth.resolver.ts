import { Resolver, Mutation, Args } from '@nestjs/graphql';

import { AuthService } from 'src/application/auth/auth.service';
import { AuthPayload } from './types/auth-payload.gql';
import { RegisterInput } from './types/register.input';
import { LoginInput } from './types/login.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    const { accessToken } = await this.authService.signUp(input);
    return { accessToken };
  }

  // @Mutation(() => AuthPayload)
  // async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
  //   const { accessToken } = await this.authService.signIn(input);
  //   return { accessToken };
  // }
}
