import { Book } from './book.entity';

describe('Book Entity (DDD Domain)', () => {
  describe('create()', () => {
    it('should initialize a new Book with undefined id and dates', () => {
      const book = Book.create({
        title: 'Dune',
        publisher: 'Ace',
        publicationDate: new Date('1965-08-01'),
        pageCount: 412,
        categoryIds: [1],
        authorIds: [1, 2],
      });
      expect(book.id).toBeUndefined();
      expect(book.title).toBe('Dune');
      expect(book.publisher).toBe('Ace');
      expect(book.publicationDate).toEqual(new Date('1965-08-01'));
      expect(book.pageCount).toBe(412);
      expect(book.categoryIds).toEqual([1]);
      expect(book.authorIds).toEqual([1, 2]);
      expect(book.createdAt).toBeUndefined();
      expect(book.updatedAt).toBeUndefined();
      expect(book.deletedAt).toBeUndefined();
    });

    it('should throw if categoryIds is empty', () => {
      expect(() =>
        Book.create({
          title: 'No Category',
          authorIds: [1],
        } as any),
      ).toThrow('Book must have at least one category');
    });

    it('should throw if authorIds is empty', () => {
      expect(() =>
        Book.create({
          title: 'No Authors',
          categoryIds: [1],
          authorIds: [],
        }),
      ).toThrow('Book must have at least one author');
    });
  });

  describe('reconstitute()', () => {
    it('should rehydrate an existing Book correctly', () => {
      const now = new Date();
      const book = Book.reconstitute({
        id: 1,
        title: 'Foundation',
        publisher: 'Gnome Press',
        publicationDate: new Date('1951-06-01'),
        pageCount: 255,
        categoryIds: [2],
        authorIds: [3],
        createdAt: now,
        updatedAt: now,
      });
      expect(book.id).toBe(1);
      expect(book.title).toBe('Foundation');
      expect(book.publisher).toBe('Gnome Press');
      expect(book.publicationDate).toEqual(new Date('1951-06-01'));
      expect(book.pageCount).toBe(255);
      expect(book.categoryIds).toEqual([2]);
      expect(book.authorIds).toEqual([3]);
      expect(book.createdAt).toBe(now);
      expect(book.updatedAt).toBe(now);
      expect(book.deletedAt).toBeUndefined();
    });

    it('should include deletedAt if provided', () => {
      const now = new Date();
      const deleted = new Date(now.getTime() + 1000);
      const book = Book.reconstitute({
        id: 2,
        title: 'Brave New World',
        publisher: 'Chatto & Windus',
        publicationDate: new Date('1932-01-01'),
        pageCount: 311,
        categoryIds: [3],
        authorIds: [4],
        createdAt: now,
        updatedAt: now,
        deletedAt: deleted,
      });
      expect(book.deletedAt).toBe(deleted);
    });
  });

  describe('update()', () => {
    it('should update all fields and set updatedAt', () => {
      const book = Book.create({
        title: 'Old Title',
        publisher: 'Old Publisher',
        publicationDate: new Date('2000-01-01'),
        pageCount: 100,
        categoryIds: [1],
        authorIds: [1],
      });
      const before = book.updatedAt;
      book.update({
        title: 'New Title',
        publisher: 'New Publisher',
        publicationDate: new Date('2020-01-01'),
        pageCount: 200,
        categoryIds: [2],
        authorIds: [2, 3],
      });
      expect(book.title).toBe('New Title');
      expect(book.publisher).toBe('New Publisher');
      expect(book.publicationDate).toEqual(new Date('2020-01-01'));
      expect(book.pageCount).toBe(200);
      expect(book.categoryIds).toEqual([2]);
      expect(book.authorIds).toEqual([2, 3]);
      expect(book.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(book.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });

    it('should throw when title is empty', () => {
      const book = Book.create({
        title: 'Valid Title',
        categoryIds: [1],
        authorIds: [1],
      });
      expect(() =>
        book.update({
          title: '',
          categoryIds: [1],
          authorIds: [1],
        }),
      ).toThrow('title cannot be empty');
    });

    it('should throw when categoryIds is empty', () => {
      const book = Book.create({
        title: 'Valid Title',
        categoryIds: [1],
        authorIds: [1],
      });
      expect(() =>
        book.update({
          title: 'New Title',
          authorIds: [1],
        } as any),
      ).toThrow('Book must have at least one category');
    });

    it('should throw when authorIds is empty', () => {
      const book = Book.create({
        title: 'Valid Title',
        categoryIds: [1],
        authorIds: [1],
      });
      expect(() =>
        book.update({
          title: 'New Title',
          categoryIds: [1],
          authorIds: [],
        }),
      ).toThrow('Book must have at least one author');
    });
  });

  describe('patch()', () => {
    it('should patch only provided fields and update updatedAt', () => {
      const book = Book.create({
        title: 'Original Title',
        publisher: 'Original Publisher',
        publicationDate: new Date('2010-01-01'),
        pageCount: 150,
        categoryIds: [1],
        authorIds: [1],
      });
      book.patch({ title: 'Updated Title' });
      expect(book.title).toBe('Updated Title');
      expect(book.updatedAt).toBeInstanceOf(Date);

      const oldUpdated = book.updatedAt!;
      book.patch({ publisher: 'Final Publisher', pageCount: 200 });
      expect(book.publisher).toBe('Final Publisher');
      expect(book.pageCount).toBe(200);
      expect(book.updatedAt).toBeInstanceOf(Date);
      expect(book.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        oldUpdated.getTime(),
      );
    });

    it('should handle empty patch object (still set updatedAt)', () => {
      const book = Book.create({
        title: 'Unchanged Title',
        categoryIds: [1],
        authorIds: [1],
      });
      const before = book.updatedAt;
      book.patch({});
      expect(book.title).toBe('Unchanged Title');
      expect(book.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(book.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });
  });

  describe('delete()', () => {
    it('should throw if id is undefined (not persisted)', () => {
      const book = Book.create({
        title: 'Will Delete',
        categoryIds: [1],
        authorIds: [1],
      });
      expect(() => book.delete()).toThrow(
        'Cannot delete a Book that has not been persisted',
      );
    });

    it('should set deletedAt and updatedAt when deleting', () => {
      const now = new Date();
      const book = Book.reconstitute({
        id: 5,
        title: 'Delete Me',
        publisher: 'Del',
        publicationDate: new Date('2015-01-01'),
        pageCount: 300,
        categoryIds: [2],
        authorIds: [2],
        createdAt: now,
        updatedAt: now,
      });
      book.delete();
      expect(book.deletedAt).toBeInstanceOf(Date);
      expect(book.updatedAt).toBe(book.deletedAt);
    });

    it('should throw if already deleted', () => {
      const now = new Date();
      const deletedTime = new Date(now.getTime() + 1000);
      const book = Book.reconstitute({
        id: 7,
        title: 'Already Deleted',
        publisher: 'Del',
        publicationDate: new Date('2015-01-01'),
        pageCount: 300,
        categoryIds: [2],
        authorIds: [2],
        createdAt: now,
        updatedAt: now,
        deletedAt: deletedTime,
      });
      expect(() => book.delete()).toThrow(
        `Book with id ${book.id} is already deleted`,
      );
    });
  });
});
