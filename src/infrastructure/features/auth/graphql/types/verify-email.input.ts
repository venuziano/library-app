import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  code: string;
} 