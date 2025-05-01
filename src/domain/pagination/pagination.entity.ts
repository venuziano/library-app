import { calculateOffset, SortOrder } from 'src/application/pagination/helpers';
import { PaginationDto } from 'src/application/pagination/pagination.dto';

export class Pagination {
  readonly limit: number;
  readonly offset: number;
  readonly sortBy: string;
  readonly order: SortOrder;
  readonly page: number;

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
    this.page = page;
  }

  static fromDto(dto: PaginationDto): Pagination {
    return new Pagination(dto.limit, dto.page, dto.sort, dto.order);
  }
}

export class PaginationResult<T> {
  constructor(
    public readonly items: T[],
    public readonly page: number,
    public readonly limit: number,
    public readonly totalItems: number,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.limit);
  }
}
