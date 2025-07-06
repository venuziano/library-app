import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateUserTokenDto } from './create-user-token.dto';

export class UpdateUserTokenDto extends CreateUserTokenDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
