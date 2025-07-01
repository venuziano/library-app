/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AuthorService } from '../../../../application/author/author.service';
import { CreateAuthorInput } from './types/create-author.input';
import { UpdateAuthorInput } from './types/update-author.input';
import { PatchAuthorInput } from './types/patch-author.input';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';

// Unit tests for AuthorResolver
describe('AuthorResolver (unit)', () => {
  let resolver: AuthorResolver;
  let service: Partial<Record<keyof AuthorService, jest.Mock>>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    } as any;
    resolver = new AuthorResolver(service as unknown as AuthorService);
  });

  it('authors() should call findAll and transform result', async () => {
    const dto: PaginationGQL = {
      limit: 10,
      page: 1,
      sort: 'id',
      order: defaultSortOrder,
      searchTerm: undefined,
    };
    const domainAuthors = [{ id: 1, firstname: 'A', lastname: 'B' } as any];
    const domainResult = {
      items: domainAuthors,
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    };
    (service.findAll as jest.Mock).mockResolvedValue(domainResult);

    const result = await resolver.authors(dto);

    expect(service.findAll).toHaveBeenCalledWith(dto);
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 1,
      firstname: 'A',
      lastname: 'B',
    });
    expect(result.pageInfo).toEqual({
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
    });
  });

  it('getById() should delegate to service.findById', () => {
    (service.findById as jest.Mock).mockResolvedValue({
      id: 2,
      firstname: 'X',
      lastname: 'Y',
    } as any);
    const call = resolver.getById(2);
    expect(service.findById).toHaveBeenCalledWith(2);
    return call;
  });

  it('createAuthor() should delegate to service.create', () => {
    const input: CreateAuthorInput = { firstname: 'New', lastname: 'User' };
    (service.create as jest.Mock).mockResolvedValue({ id: 3, ...input } as any);
    resolver.createAuthor(input);
    expect(service.create).toHaveBeenCalledWith(input);
  });

  it('updateAuthor() should delegate to service.update', () => {
    const input: UpdateAuthorInput = {
      id: 4,
      firstname: 'Up',
      lastname: 'Date',
    };
    resolver.updateAuthor(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it('deleteAuthor() should delegate to service.delete', () => {
    resolver.deleteAuthor(5);
    expect(service.delete).toHaveBeenCalledWith(5);
  });

  it('patchAuthor() should delegate to service.patch', () => {
    const input: PatchAuthorInput = { id: 6, firstname: 'P', lastname: 'Tch' };
    resolver.patchAuthor(input);
    expect(service.patch).toHaveBeenCalledWith(input);
  });
});

// Integration tests for AuthorResolver
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import request from 'supertest';
import { Test as NestTest } from '@nestjs/testing';
import {
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';
import { AuthorResolver } from './author.resolver';

describe('AuthorResolver (integration)', () => {
  let app: INestApplication;
  const mockAuthors = [
    { id: 1, firstname: 'Alice', lastname: 'Smith' },
    { id: 2, firstname: 'Bob', lastname: 'Jones' },
  ];
  const paginated = {
    items: mockAuthors,
    page: 2,
    limit: 10,
    totalItems: 10,
    totalPages: 2,
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
        AuthorResolver,
        {
          provide: AuthorService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(paginated),
            findById: jest.fn().mockResolvedValue(mockAuthors[0]),
            create: jest.fn().mockResolvedValue(mockAuthors[0]),
            update: jest.fn().mockResolvedValue(mockAuthors[0]),
            delete: jest.fn().mockResolvedValue(mockAuthors[0]),
            patch: jest.fn().mockResolvedValue(mockAuthors[0]),
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

  it('executes getAllAuthors query', () => {
    const query = `query getAllAuthors($limit: Int!, $page: Int!, $sort: String!, $order: SortOrder!) {
      getAllAuthors(limit: $limit, page: $page, sort: $sort, order: $order) {
        items { updatedAt id firstname lastname }
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
        const data = res.body.data.getAllAuthors;
        expect(data.items).toHaveLength(2);
        expect(data.pageInfo.totalItems).toBe(2);
        expect(data.pageInfo.currentPage).toBe(1);
        expect(data.pageInfo.totalPages).toBe(1);
      });
  });

  it('executes getByIdAuthor query', () => {
    const query = `query($id: ID!) { getByIdAuthor(id: $id) { id firstname lastname } }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.getByIdAuthor.id).toBe('1');
        expect(res.body.data.getByIdAuthor.firstname).toBe('Alice');
      });
  });

  it('executes createAuthor mutation', () => {
    const mutation = `mutation($input: CreateAuthorInput!) {
      createAuthor(input: $input) { id firstname lastname }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { firstname: 'Alice', lastname: 'Smith' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.createAuthor;
        expect(data.id).toBe('1');
        expect(data.firstname).toBe('Alice');
        expect(data.lastname).toBe('Smith');
      });
  });

  it('executes updateAuthor mutation', () => {
    const mutation = `mutation($input: UpdateAuthorInput!) {
      updateAuthor(input: $input) { id firstname lastname }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { id: 1, firstname: 'Alice', lastname: 'Smith' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.updateAuthor;
        expect(data.id).toBe('1');
        expect(data.firstname).toBe('Alice');
        expect(data.lastname).toBe('Smith');
      });
  });

  it('executes deleteAuthor mutation', () => {
    const mutation = `mutation($id: Int!) {
      deleteAuthor(id: $id) { id firstname lastname }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.deleteAuthor;
        expect(data.id).toBe('1');
        expect(data.firstname).toBe('Alice');
        expect(data.lastname).toBe('Smith');
      });
  });

  it('executes patchAuthor mutation', () => {
    const mutation = `mutation($input: PatchAuthorInput!) {
      patchAuthor(input: $input) { id firstname lastname }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { id: 1, firstname: 'AliceUpdated' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.patchAuthor;
        expect(data.id).toBe('1');
        expect(data.firstname).toBe('Alice');
        expect(data.lastname).toBe('Smith');
      });
  });
});
