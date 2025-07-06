import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

@InputType()
export class LoginInput {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  password: string;
}
