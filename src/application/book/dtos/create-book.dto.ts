import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDate,
  IsArray,
  ArrayMinSize,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  title: string;

  @Type(() => String)
  @IsString()
  @IsOptional()
  publisher?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  publicationDate?: Date;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  pageCount?: number;

  @Type(() => Number)
  @IsArray()
  @ArrayMinSize(1, { message: 'Book must have at least one category' })
  @IsNumber({}, { each: true })
  categoryIds: number[];

  @Type(() => Number)
  @IsArray()
  @ArrayMinSize(1, { message: 'Book must have at least one author' })
  @IsNumber({}, { each: true })
  authorIds: number[];
}
