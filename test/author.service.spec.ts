import { Test, TestingModule } from '@nestjs/testing';
import { AuthorService } from '../src/application/author/author.service';
import { AuthorRepository } from '../src/domain/author/author.repository';
import { Author } from '../src/domain/author/author.entity';

const mockRepo: Partial<AuthorRepository> = {
  findAll: jest.fn().mockResolvedValue([new Author('Alice', 'lastname')]),
  findById: jest.fn().mockResolvedValue(new Author('Alice', 'lastname')),
  create: jest.fn().mockImplementation((a) => Promise.resolve(a as Author)),
};

describe('AuthorService', () => {
  let svc: AuthorService;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorService,
        { provide: 'AuthorRepository', useValue: mockRepo },
      ],
    }).compile();

    svc = mod.get<AuthorService>(AuthorService);
  });

  it('findAll returns array', async () => {
    const authors = await svc.findAll();
    expect(authors).toHaveLength(1);
    expect(authors[0].firstname).toBe('Alice');
  });

  it('findById returns single', async () => {
    const a = await svc.findById('1');
    expect(a).toBeInstanceOf(Author);
  });

  it('create an author', async () => {
    const dto = { firstname: 'Rafael', lastname: 'Rodrigues' };
    const createdAuthor = await svc.create(dto);
    expect(createdAuthor.firstname).toBe('Rafael');
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
