import { UserService } from '../../../../application/user/user.service';
import { CreateUserInput } from './types/create-user.input';
import { UpdateUserInput } from './types/update-user.input';
import { PatchUserInput } from './types/patch-user.input';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';
import { UserResolver } from './user.resolver';
import {
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';

// Unit tests
describe('UserResolver (unit)', () => {
  let resolver: UserResolver;
  let service: Partial<Record<keyof UserService, jest.Mock>>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    } as any;
    resolver = new UserResolver(service as unknown as UserService);
  });

  it('users() should call findAll and transform result', async () => {
    const dto: PaginationGQL = {
      limit: 10,
      page: 1,
      sort: 'id',
      order: defaultSortOrder,
      searchTerm: undefined,
    };
    const domainUsers = [
      { id: 1, username: 'A', email: 'a@example.com' } as any,
    ];
    const domainResult = {
      items: domainUsers,
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    };
    (service.findAll as jest.Mock).mockResolvedValue(domainResult);

    const result = await resolver.users(dto);

    expect(service.findAll).toHaveBeenCalledWith(dto);
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 1,
      username: 'A',
      email: 'a@example.com',
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
      username: 'X',
      email: 'x@example.com',
    } as any);
    const call = resolver.getById(2);
    expect(service.findById).toHaveBeenCalledWith(2);
    return call;
  });

  it('createUser() should delegate to service.create', () => {
    const input: CreateUserInput = {
      username: 'NewUser',
      password: 'password',
      firstname: 'New',
      lastname: 'User',
      email: 'new@user.com',
      stripeCustomerId: 'cus_new',
    };
    (service.create as jest.Mock).mockResolvedValue({ id: 3, ...input } as any);
    resolver.createUser(input);
    expect(service.create).toHaveBeenCalledWith(input);
  });

  it('updateUser() should delegate to service.update', () => {
    const input: UpdateUserInput = {
      id: 4,
      username: 'UpUser',
      password: 'password',
      firstname: 'Up',
      lastname: 'Date',
      email: 'up@date.com',
      stripeCustomerId: 'cus_up',
    };
    resolver.updateUser(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it('deleteUser() should delegate to service.delete', () => {
    resolver.deleteUser(5);
    expect(service.delete).toHaveBeenCalledWith(5);
  });

  it('patchUser() should delegate to service.patch', () => {
    const input: PatchUserInput = {
      id: 6,
      firstname: 'P',
      lastname: 'Tch',
    };
    resolver.patchUser(input);
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

describe('UserResolver (integration)', () => {
  let app: INestApplication;
  const nowIso = new Date().toISOString();
  const mockUsers = [
    {
      id: 1,
      username: 'Alice',
      password: 'password',
      firstname: 'Alice',
      lastname: 'Smith',
      email: 'alice@example.com',
      stripeCustomerId: 'cus_1',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      username: 'Bob',
      password: 'password',
      firstname: 'Bob',
      lastname: 'Jones',
      email: 'bob@example.com',
      stripeCustomerId: 'cus_2',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const paginated = {
    items: mockUsers,
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
        UserResolver,
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(paginated),
            findById: jest.fn().mockResolvedValue(mockUsers[0]),
            create: jest.fn().mockResolvedValue(mockUsers[0]),
            update: jest.fn().mockResolvedValue(mockUsers[0]),
            delete: jest.fn().mockResolvedValue(mockUsers[0]),
            patch: jest.fn().mockResolvedValue(mockUsers[0]),
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

  it('executes getAllUsers query', () => {
    const query = `query getAllUsers($limit: Int!, $page: Int!, $sort: String!, $order: SortOrder!) {
      getAllUsers(limit: $limit, page: $page, sort: $sort, order: $order) {
        items { updatedAt id username firstname lastname email stripeCustomerId }
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
        const data = res.body.data.getAllUsers;
        expect(data.items).toHaveLength(2);
        expect(data.pageInfo.totalItems).toBe(2);
        expect(data.pageInfo.currentPage).toBe(1);
        expect(data.pageInfo.totalPages).toBe(1);
      });
  });

  it('executes getUserById query', () => {
    const query = `query($id: ID!) { getUserById(id: $id) { id username email } }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.getUserById.id).toBe('1');
        expect(res.body.data.getUserById.username).toBe('Alice');
      });
  });

  it('executes createUser mutation', () => {
    const mutation = `mutation($input: CreateUserInput!) {
      createUser(input: $input) { id username email password }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: {
          input: {
            username: 'Alice',
            email: 'alice@example.com',
            password: 'password',
          },
        },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.createUser;
        expect(data.id).toBe('1');
        expect(data.username).toBe('Alice');
        expect(data.email).toBe('alice@example.com');
      });
  });

  it('executes updateUser mutation', () => {
    const mutation = `mutation($input: UpdateUserInput!) {
      updateUser(input: $input) { id username email password }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: {
          input: {
            id: 1,
            username: 'Alice',
            email: 'alice@example.com',
            password: 'password',
          },
        },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.updateUser;
        expect(data.id).toBe('1');
        expect(data.username).toBe('Alice');
        expect(data.email).toBe('alice@example.com');
      });
  });

  it('executes deleteUser mutation', () => {
    const mutation = `mutation($id: Int!) {
      deleteUser(id: $id) { id username email }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation, variables: { id: 1 } })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.deleteUser;
        expect(data.id).toBe('1');
        expect(data.username).toBe('Alice');
        expect(data.email).toBe('alice@example.com');
      });
  });

  it('executes patchUser mutation', () => {
    const mutation = `mutation($input: PatchUserInput!) {
      patchUser(input: $input) { id username email }
    }`;
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: mutation,
        variables: { input: { id: 1, username: 'AliceUpdated' } },
      })
      .expect(200)
      .expect((res) => {
        const data = res.body.data.patchUser;
        expect(data.id).toBe('1');
        expect(data.username).toBe('Alice');
        expect(data.email).toBe('alice@example.com');
      });
  });
});
