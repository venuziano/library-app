/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthorService } from '../../src/application/author/author.service';
import { Author } from '../../src/domain/author/author.entity';

describe('AuthorService', () => {
  let svc: AuthorService;
  let mockRepo: {
    findAll: jest.Mock<Promise<Author[]>, []>;
    findById: jest.Mock<Promise<Author | null>, [number]>;
    findByFirstname: jest.Mock<Promise<Author | null>, [string]>;
    create: jest.Mock<Promise<Author>, [Author]>;
  };

  const now = new Date();

  beforeEach(async () => {
    // Fresh mockRepo each test:
    mockRepo = {
      findAll: jest.fn().mockResolvedValue([
        Author.reconstitute({
          id: 1,
          firstname: 'Alice',
          lastname: 'Smith',
          createdAt: now,
          updatedAt: now,
        }),
      ]),
      findById: jest.fn().mockResolvedValue(
        Author.reconstitute({
          id: 2,
          firstname: 'Bob',
          lastname: 'Jones',
          createdAt: now,
          updatedAt: now,
        }),
      ),
      findByFirstname: jest.fn(),
      create: jest.fn().mockImplementation(async (author: Author) => {
        await Promise.resolve();
        // simulate “saving”:
        return Author.reconstitute({
          id: 42,
          firstname: author.firstname,
          lastname: author.lastname,
          createdAt: now,
          updatedAt: now,
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorService,
        { provide: 'AuthorRepository', useValue: mockRepo },
      ],
    }).compile();

    svc = module.get<AuthorService>(AuthorService);
  });

  it('findAll returns array', async () => {
    const authors = await svc.findAll();
    expect(authors).toHaveLength(1);
    expect(authors[0].firstname).toBe('Alice');
  });

  it('findById returns single', async () => {
    const author = await svc.findById(2);
    expect(author).toBeInstanceOf(Author);
  });

  describe('create()', () => {
    const dto = { firstname: 'Rafael', lastname: 'Rodrigues' };

    it('creates a new author when none exists', async () => {
      mockRepo.findByFirstname.mockResolvedValue(null);

      const result = await svc.create(dto);

      expect(mockRepo.findByFirstname).toHaveBeenCalledWith('Rafael');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.any(Author));
      expect(result.firstname).toBe('Rafael');
    });

    it('throws ConflictException if an author exists', async () => {
      // simulate a conflict
      mockRepo.findByFirstname.mockResolvedValue(
        Author.reconstitute({
          id: 99,
          firstname: 'Rafael',
          lastname: 'Rodrigues',
          createdAt: now,
          updatedAt: now,
        }),
      );

      await expect(svc.create(dto)).rejects.toThrow(ConflictException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });
});
