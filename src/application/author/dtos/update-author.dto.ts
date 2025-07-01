import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

import { CreateAuthorDto } from './create-author.dto';

export class UpdateAuthorDto extends CreateAuthorDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
