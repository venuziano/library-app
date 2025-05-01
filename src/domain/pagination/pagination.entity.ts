import { calculateOffset, SortOrder } from 'src/application/pagination/helpers';
import { PaginationDto } from 'src/application/pagination/pagination.dto';

export class Pagination {
  readonly limit: number;
  readonly offset: number;
  readonly sortBy: string;
  readonly order: SortOrder;

  private constructor(
    limit: number,
    page: number,
    sortBy: string,
    order: SortOrder,
  ) {
    this.limit = limit;
    this.offset = calculateOffset(limit, page);
    this.sortBy = sortBy;
    this.order = order;
  }

  static fromDto(dto: PaginationDto): Pagination {
    return new Pagination(dto.limit, dto.page, dto.sort, dto.order);
  }
}
