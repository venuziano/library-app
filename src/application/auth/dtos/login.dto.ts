import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @Type(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  password: string;
}
