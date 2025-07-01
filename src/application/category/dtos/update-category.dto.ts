import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends CreateCategoryDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
