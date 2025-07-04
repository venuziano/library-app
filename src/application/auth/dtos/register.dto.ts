import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  username: string;

  @Type(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Type(() => String)
  @IsOptional()
  @IsString()
  firstname?: string;

  @Type(() => String)
  @IsOptional()
  @IsString()
  lastname?: string;
}
