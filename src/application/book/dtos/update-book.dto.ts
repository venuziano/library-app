import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

import { CreateBookDto } from './create-book.dto';

export class UpdateBookDto extends CreateBookDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
