import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  username: string;

  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  firstname?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  lastname?: string;
}
