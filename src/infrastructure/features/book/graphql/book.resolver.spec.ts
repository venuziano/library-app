import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import request from 'supertest';
import { Test as NestTest } from '@nestjs/testing';
import { BookService } from '../../../../application/book/book.service';
import { CreateBookInput } from './types/create-book.input';
import { UpdateBookInput } from './types/update-book.input';
import { PatchBookInput } from './types/patch-book.input';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';
import { BookResolver } from './book.resolver';
import {
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';
import { BookGQL } from './types/book.gql';
import { CategoryGQL } from '../../category/graphql/types/category.gql';
import { AuthorGQL } from '../../author/graphql/types/author.gql';
import { CategoryLoader } from 'src/infrastructure/graphql/loaders/category.loader';
import { AuthorLoader } from 'src/infrastructure/graphql/loaders/author.loader';

describe('BookResolver (unit)', () => {
  let resolver: BookResolver;
  let service: Partial<Record<keyof BookService, jest.Mock>>;
  let mockCategoryLoader: { loadMany: jest.Mock<any, any> };
  let mockAuthorLoader: { loadMany: jest.Mock<any, any> };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    };
    mockCategoryLoader = { loadMany: jest.fn() };
    mockAuthorLoader = { loadMany: jest.fn() };
    resolver = new BookResolver(
      service as unknown as BookService,
      mockCategoryLoader as any,
      mockAuthorLoader as any,
    );
  });

  it('books() calls service.findAll and returns PaginatedBooksGQL', async () => {
    const dto: PaginationGQL = {
      limit: 10,
      page: 1,
      sort: 'id',
      order: defaultSortOrder,
      searchTerm: undefined,
    };
    const domainBooks = [
      { id: 1, title: 'Book1', categoryIds: [1], authorIds: [1] },
    ] as any[];
    const domainResult = {
      items: domainBooks,
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    };
    (service.findAll as jest.Mock).mockResolvedValue(domainResult);

    const paginated = await resolver.books(dto);

    expect(service.findAll).toHaveBeenCalledWith(dto);
    expect(paginated.items).toHaveLength(1);
    expect(paginated.items[0]).toBeInstanceOf(BookGQL);
    expect(paginated.pageInfo).toEqual({
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
    });
  });

  it('getById() delegates to service.findById', async () => {
    const book = { id: 2, title: 'Book2', categoryIds: [1], authorIds: [1] };
    (service.findById as jest.Mock).mockResolvedValue(book);

    const result = await resolver.getById(2);
    expect(service.findById).toHaveBeenCalledWith(2);
    expect(result).toBe(book);
  });

  it('create/update/patch/delete delegate to respective service methods', () => {
    const createInput: CreateBookInput = {
      title: 'New',
      categoryIds: [1],
      authorIds: [1],
    } as any;
    resolver.createBook(createInput);
    expect(service.create).toHaveBeenCalledWith(createInput);

    const updateInput: UpdateBookInput = {
      id: 4,
      title: 'Up',
      categoryIds: [1],
      authorIds: [1],
    } as any;
    resolver.updateBook(updateInput);
    expect(service.update).toHaveBeenCalledWith(updateInput);

    const patchInput: PatchBookInput = {
      id: 6,
      title: 'Patch',
      categoryIds: [1],
      authorIds: [1],
    } as any;
    resolver.patchBook(patchInput);
    expect(service.patch).toHaveBeenCalledWith(patchInput);

    resolver.deleteBook(5);
    expect(service.delete).toHaveBeenCalledWith(5);
  });

  it('categories resolve field loads via loader and filters nulls', async () => {
    const gqlBook = { categoryIds: [1, 2] } as BookGQL;
    const dummyCategory: CategoryGQL = {
      id: 1,
      name: 'Category',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    };
    mockCategoryLoader.loadMany.mockResolvedValue([dummyCategory, null]);

    const categories = await resolver.categories(gqlBook);
    expect(mockCategoryLoader.loadMany).toHaveBeenCalledWith([1, 2]);
    expect(categories).toEqual([dummyCategory]);
  });

  it('authors resolve field loads via loader and filters nulls', async () => {
    const gqlBook = { authorIds: [3] } as BookGQL;
    const dummyAuthor: AuthorGQL = {
      id: 3,
      firstname: 'First',
      lastname: 'Last',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    };
    mockAuthorLoader.loadMany.mockResolvedValue([dummyAuthor, null]);

    const authors = await resolver.authors(gqlBook);
    expect(mockAuthorLoader.loadMany).toHaveBeenCalledWith([3]);
    expect(authors).toEqual([dummyAuthor]);
  });
});

// Integration tests

describe('BookResolver (integration)', () => {
  let app: INestApplication;
  const now = new Date();
  const mockBooks = [
    {
      id: 1,
      title: 'Book A',
      categoryIds: [1],
      authorIds: [1],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      title: 'Book B',
      categoryIds: [2],
      authorIds: [2],
      createdAt: now,
      updatedAt: now,
    },
  ];
  const paginated = {
    items: mockBooks,
    page: 1,
    limit: 10,
    totalItems: 2,
    totalPages: 1,
  };

  beforeAll(async () => {
    const module = await NestTest.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        }),
      ],
      providers: [
        BookResolver,
        {
          provide: BookService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(paginated),
            findById: jest.fn().mockResolvedValue(mockBooks[0]),
            create: jest.fn().mockResolvedValue(mockBooks[0]),
            update: jest.fn().mockResolvedValue(mockBooks[0]),
            delete: jest.fn().mockResolvedValue(mockBooks[0]),
            patch: jest.fn().mockResolvedValue(mockBooks[0]),
          },
        },
        {
          provide: CategoryLoader,
          useValue: {
            loadMany: jest.fn().mockImplementation((ids: number[]) =>
              Promise.resolve(
                ids.map(
                  (id) =>
                    ({
                      id,
                      name: `Category${id}`,
                      createdAt: now,
                      updatedAt: now,
                      deletedAt: now,
                    }) as CategoryGQL,
                ),
              ),
            ),
          },
        },
        {
          provide: AuthorLoader,
          useValue: {
            loadMany: jest.fn().mockImplementation((ids: number[]) =>
              Promise.resolve(
                ids.map(
                  (id) =>
                    ({
                      id,
                      firstname: `AuthorFirst${id}`,
                      lastname: `AuthorLast${id}`,
                      createdAt: now,
                      updatedAt: now,
                      deletedAt: now,
                    }) as AuthorGQL,
                ),
              ),
            ),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('executes getAllBooks query', () => {
    const query = `query getAllBooks($limit: Int!, $page: Int!, $sort: String!, $order: SortOrder!) {
      getAllBooks(limit: $limit, page: $page, sort: $sort, order: $order) {
        items { updatedAt id title categories { name } authors { id, firstname, lastname } }
        pageInfo { totalItems totalPages currentPage }
      }
    }`;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables: { limit: 10, page: 1, sort: 'id', order: SortOrder.ASC },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.getAllBooks;
        expect(data.items).toHaveLength(2);
        expect(data.pageInfo).toEqual({
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
        });
      });
  });

  it('executes getBookById query', () => {
    const query = `query($id: ID!) { getBookById(id: $id) { id title categories { name } authors { id, firstname, lastname } } }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        const book = res.body.data.getBookById;
        expect(book.id).toBe('1');
        expect(book.title).toBe('Book A');
      });
  });

  it('executes createBook mutation', () => {
    const mutation = `mutation($input: CreateBookInput!) {
      createBook(input: $input) { id title categories { name } authors { id, firstname, lastname } }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: {
          input: { title: 'Book A', categoryIds: [1], authorIds: [1] },
        },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.createBook;
        expect(data.id).toBe('1');
        expect(data.title).toBe('Book A');
        expect(data.categories).toHaveLength(1);
        expect(data.authors).toHaveLength(1);
      });
  });

  it('executes updateBook mutation', () => {
    const mutation = `mutation($input: UpdateBookInput!) {
      updateBook(input: $input) { id title categories { name } authors { id, firstname, lastname } }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: {
          input: { id: 1, title: 'Book A', categoryIds: [1], authorIds: [1] },
        },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.updateBook;
        expect(data.id).toBe('1');
        expect(data.title).toBe('Book A');
        expect(data.categories).toHaveLength(1);
        expect(data.authors).toHaveLength(1);
      });
  });

  it('executes deleteBook mutation', () => {
    const mutation = `mutation($id: Int!) {
      deleteBook(id: $id) { id title categories { name } authors { id, firstname, lastname } }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.deleteBook;
        expect(data.id).toBe('1');
        expect(data.title).toBe('Book A');
        expect(data.categories).toHaveLength(1);
        expect(data.authors).toHaveLength(1);
      });
  });

  it('executes patchBook mutation', () => {
    const mutation = `mutation($input: PatchBookInput!) {
      patchBook(input: $input) { id title categories { name } authors { id, firstname, lastname } }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { id: 1, title: 'Book A' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.patchBook;
        expect(data.id).toBe('1');
        expect(data.title).toBe('Book A');
        expect(data.categories).toHaveLength(1);
        expect(data.authors).toHaveLength(1);
      });
  });
});
