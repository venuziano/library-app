import { IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;
}
