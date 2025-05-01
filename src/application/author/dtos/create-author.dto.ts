import { IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuthorDto {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  lastname: string;
}
