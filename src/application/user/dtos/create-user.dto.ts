import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  username: string;

  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Type(() => String)
  @IsString()
  @IsOptional()
  firstname?: string;

  @Type(() => String)
  @IsString()
  @IsOptional()
  lastname?: string;

  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Type(() => String)
  @IsString()
  @IsOptional()
  stripeCustomerId?: string;
}
