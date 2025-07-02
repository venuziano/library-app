/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CategoryService } from '../../../../application/category/category.service';
import { CreateCategoryInput } from './types/create-category.input';
import { UpdateCategoryInput } from './types/update-category.input';
import { PatchCategoryInput } from './types/patch-category.input';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';

// Unit tests
describe('CategoryResolver (unit)', () => {
  let resolver: CategoryResolver;
  let service: Partial<Record<keyof CategoryService, jest.Mock>>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    } as any;
    resolver = new CategoryResolver(service as unknown as CategoryService);
  });

  it('categories() should call findAll and transform result', async () => {
    const dto: PaginationGQL = {
      limit: 10,
      page: 1,
      sort: 'id',
      order: defaultSortOrder,
      searchTerm: undefined,
    };
    const domainCategories = [{ id: 1, name: 'Fiction' } as any];
    const domainResult = {
      items: domainCategories,
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    };
    (service.findAll as jest.Mock).mockResolvedValue(domainResult);

    const result = await resolver.categories(dto);

    expect(service.findAll).toHaveBeenCalledWith(dto);
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 1,
      name: 'Fiction',
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
      name: 'Science Fiction',
    } as any);
    const call = resolver.getById(2);
    expect(service.findById).toHaveBeenCalledWith(2);
    return call;
  });

  it('createCategory() should delegate to service.create', () => {
    const input: CreateCategoryInput = { name: 'Mystery' };
    (service.create as jest.Mock).mockResolvedValue({ id: 3, ...input } as any);
    resolver.createCategory(input);
    expect(service.create).toHaveBeenCalledWith(input);
  });

  it('updateCategory() should delegate to service.update', () => {
    const input: UpdateCategoryInput = {
      id: 4,
      name: 'Romance',
    };
    resolver.updateCategory(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it('deleteCategory() should delegate to service.delete', () => {
    resolver.deleteCategory(5);
    expect(service.delete).toHaveBeenCalledWith(5);
  });

  it('patchCategory() should delegate to service.patch', () => {
    const input: PatchCategoryInput = { id: 6, name: 'Thriller' };
    resolver.patchCategory(input);
    expect(service.patch).toHaveBeenCalledWith(input);
  });
});

// Integration tests
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
import { CategoryResolver } from './category.resolver';

describe('CategoryResolver (integration)', () => {
  let app: INestApplication;
  const nowIso = new Date().toISOString();
  const mockCategories = [
    {
      id: 1,
      name: 'Fiction',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      name: 'Science Fiction',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const paginated = {
    items: mockCategories,
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
        CategoryResolver,
        {
          provide: CategoryService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(paginated),
            findById: jest.fn().mockResolvedValue(mockCategories[0]),
            create: jest.fn().mockResolvedValue(mockCategories[0]),
            update: jest.fn().mockResolvedValue(mockCategories[0]),
            delete: jest.fn().mockResolvedValue(mockCategories[0]),
            patch: jest.fn().mockResolvedValue(mockCategories[0]),
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

  it('executes getAllCategories query', () => {
    const query = `query getAllCategories($limit: Int!, $page: Int!, $sort: String!, $order: SortOrder!) {
      getAllCategories(limit: $limit, page: $page, sort: $sort, order: $order) {
        items { updatedAt id name }
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
        const data = res.body.data.getAllCategories;
        expect(data.items).toHaveLength(2);
        expect(data.pageInfo.totalItems).toBe(2);
        expect(data.pageInfo.currentPage).toBe(1);
        expect(data.pageInfo.totalPages).toBe(1);
      });
  });

  it('executes getCategoryById query', () => {
    const query = `query($id: ID!) { getCategoryById(id: $id) { id name } }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.getCategoryById.id).toBe('1');
        expect(res.body.data.getCategoryById.name).toBe('Fiction');
      });
  });

  it('executes createCategory mutation', () => {
    const mutation = `mutation($input: CreateCategoryInput!) {
      createCategory(input: $input) { id name }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { name: 'Mystery' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.createCategory;
        expect(data.id).toBe('1');
        expect(data.name).toBe('Fiction');
      });
  });

  it('executes updateCategory mutation', () => {
    const mutation = `mutation($input: UpdateCategoryInput!) {
      updateCategory(input: $input) { id name }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { id: 1, name: 'Romance' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.updateCategory;
        expect(data.id).toBe('1');
        expect(data.name).toBe('Fiction');
      });
  });

  it('executes deleteCategory mutation', () => {
    const mutation = `mutation($id: Int!) {
      deleteCategory(id: $id) { id name }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.deleteCategory;
        expect(data.id).toBe('1');
        expect(data.name).toBe('Fiction');
      });
  });

  it('executes patchCategory mutation', () => {
    const mutation = `mutation($input: PatchCategoryInput!) {
      patchCategory(input: $input) { id name }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { id: 1, name: 'Thriller' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.patchCategory;
        expect(data.id).toBe('1');
        expect(data.name).toBe('Fiction');
      });
  });
});
