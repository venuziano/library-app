import { calculateOffset, SortOrder } from 'src/application/pagination/helpers';

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

  static of(
    limit: number,
    page: number,
    sortBy: string,
    order: SortOrder,
  ): Pagination {
    return new Pagination(limit, page, sortBy, order);
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
