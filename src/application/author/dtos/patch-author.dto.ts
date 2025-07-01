import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { CreateAuthorDto } from './create-author.dto';

export class PatchAuthorDto extends PartialType(CreateAuthorDto) {
  @Type(() => Number)
  @IsNumber()
  id: number;
}
