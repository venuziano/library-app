import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { CreateBookDto } from './create-book.dto';

export class PatchBookDto extends PartialType(CreateBookDto) {
  @Type(() => Number)
  @IsNumber()
  id: number;
}
