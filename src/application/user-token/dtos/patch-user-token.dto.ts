import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { CreateUserTokenDto } from './create-user-token.dto';

export class PatchUserTokenDto extends PartialType(CreateUserTokenDto) {
  @Type(() => Number)
  @IsNumber()
  id: number;
}
