import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class PatchUserDto extends PartialType(CreateUserDto) {
  @Type(() => Number)
  @IsNumber()
  id: number;
}
