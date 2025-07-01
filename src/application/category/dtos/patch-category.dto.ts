import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { CreateCategoryDto } from './create-category.dto';

export class PatchCategoryDto extends PartialType(CreateCategoryDto) {
  @Type(() => Number)
  @IsNumber()
  id: number;
}
