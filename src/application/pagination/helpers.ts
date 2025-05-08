import { registerEnumType } from '@nestjs/graphql';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort direction (ascending or descending)',
});

export const defaultSortField: string = 'createdAt';
export const defaultSortOrder: SortOrder = SortOrder.DESC;
export const defaultPaginationValue: number = 50;

export const calculateOffset = (page: number, limit: number): number =>
  (page - 1) * limit;
