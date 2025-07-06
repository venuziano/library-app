import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TokenType } from 'src/domain/user-token/token-type.enum';

export class CreateUserTokenDto {
  @Type(() => Number)
  @IsNotEmpty()
  userId: number;

  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  @IsEnum(TokenType)
  tokenType: TokenType;

  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  code: string;
}
