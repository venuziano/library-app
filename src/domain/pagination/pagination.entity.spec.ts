import { Pagination, PaginationResult } from './pagination.entity';
import {
  calculateOffset,
  defaultSortOrder,
} from 'src/application/pagination/helpers';

describe('Pagination', () => {
  it('should assign all fields and compute offset', () => {
    const limit = 20;
    const page = 3;
    const sortBy = 'name';
    const order = defaultSortOrder;
    const search = 'foo';
    // real calculateOffset(20,3) === 40
    const pag = Pagination.of(limit, page, sortBy, order, search);

    expect(pag.limit).toBe(limit);
    expect(pag.page).toBe(page);
    expect(pag.sortBy).toBe(sortBy);
    expect(pag.order).toBe(order);
    expect(pag.searchTerm).toBe(search);
    expect(pag.offset).toBe(calculateOffset(limit, page));
  });

  it('should allow undefined searchTerm', () => {
    const pag = Pagination.of(10, 1, 'id', defaultSortOrder, undefined);
    expect(pag.searchTerm).toBeUndefined();
  });
});

describe('PaginationResult.totalPages', () => {
  it('returns exact quotient when divisible', () => {
    const result = new PaginationResult([], 1, 5, 15);
    expect(result.totalPages).toBe(3);
  });

  it('rounds up when not divisible', () => {
    const result = new PaginationResult([], 1, 10, 21);
    expect(result.totalPages).toBe(3);
  });

  it('returns 0 when there are no items', () => {
    const result = new PaginationResult([], 1, 10, 0);
    expect(result.totalPages).toBe(0);
  });
});
