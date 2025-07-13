import { IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  message: string;
}
