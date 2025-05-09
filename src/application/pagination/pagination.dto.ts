import { IsInt, Min, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

import {
  defaultPaginationValue,
  defaultSortField,
  defaultSortOrder,
  SortOrder,
} from './helpers';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  limit = defaultPaginationValue;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  page = 0;

  @IsOptional()
  @IsString()
  sort = defaultSortField;

  @IsOptional()
  @Type(() => String)
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'order must be ASC or DESC' })
  order: SortOrder = defaultSortOrder;
}
