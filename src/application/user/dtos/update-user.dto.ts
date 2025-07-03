import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends CreateUserDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
