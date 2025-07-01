import { Author } from './author.entity';

describe('Author Entity (DDD Domain)', () => {
  describe('create()', () => {
    it('should initialize a new Author with undefined id and dates', () => {
      const author = Author.create({ firstname: 'John', lastname: 'Doe' });
      expect(author.id).toBeUndefined();
      expect(author.firstname).toBe('John');
      expect(author.lastname).toBe('Doe');
      expect(author.createdAt).toBeUndefined();
      expect(author.updatedAt).toBeUndefined();
      expect(author.deletedAt).toBeUndefined();
    });
  });

  describe('reconstitute()', () => {
    it('should rehydrate an existing Author correctly', () => {
      const now = new Date();
      const author = Author.reconstitute({
        id: 1,
        firstname: 'Jane',
        lastname: 'Smith',
        createdAt: now,
        updatedAt: now,
      });

      expect(author.id).toBe(1);
      expect(author.firstname).toBe('Jane');
      expect(author.lastname).toBe('Smith');
      expect(author.createdAt).toBe(now);
      expect(author.updatedAt).toBe(now);
      expect(author.deletedAt).toBeUndefined();
    });

    it('should include deletedAt if provided', () => {
      const now = new Date();
      const deleted = new Date(now.getTime() + 1000);
      const author = Author.reconstitute({
        id: 2,
        firstname: 'Alice',
        lastname: 'Wonder',
        createdAt: now,
        updatedAt: now,
        deletedAt: deleted,
      });

      expect(author.deletedAt).toBe(deleted);
    });
  });

  describe('update()', () => {
    it('should update firstname, lastname and set updatedAt', () => {
      const author = Author.create({ firstname: 'Old', lastname: 'Name' });
      const before = author.updatedAt;
      author.update('New', 'Name');
      expect(author.firstname).toBe('New');
      expect(author.lastname).toBe('Name');
      expect(author.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(author.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });

    it('should throw when firstname is empty', () => {
      const author = Author.create({ firstname: 'First', lastname: 'Last' });
      expect(() => author.update('', 'Last')).toThrow(
        'firstname and lastname cannot be empty',
      );
    });

    it('should throw when lastname is empty', () => {
      const author = Author.create({ firstname: 'First', lastname: 'Last' });
      expect(() => author.update('First', '')).toThrow(
        'firstname and lastname cannot be empty',
      );
    });
  });

  describe('patch()', () => {
    it('should patch only provided fields and update updatedAt', () => {
      const author = Author.create({ firstname: 'A', lastname: 'B' });
      author.patch({ firstname: 'X' });
      expect(author.firstname).toBe('X');
      expect(author.lastname).toBe('B');
      expect(author.updatedAt).toBeInstanceOf(Date);

      const oldUpdated = author.updatedAt!;
      author.patch({ lastname: 'Y' });
      expect(author.firstname).toBe('X');
      expect(author.lastname).toBe('Y');
      expect(author.updatedAt).toBeInstanceOf(Date);
      expect(author.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        oldUpdated.getTime(),
      );
    });

    it('should handle empty patch object (still set updatedAt)', () => {
      const author = Author.create({ firstname: 'A', lastname: 'B' });
      const before = author.updatedAt;
      author.patch({});
      expect(author.firstname).toBe('A');
      expect(author.lastname).toBe('B');
      expect(author.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(author.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });
  });

  describe('delete()', () => {
    it('should throw if id is undefined (not persisted)', () => {
      const author = Author.create({ firstname: 'Will', lastname: 'Delete' });
      expect(() => author.delete()).toThrow(
        'Cannot delete an Author that has not been persisted',
      );
    });

    it('should set deletedAt and updatedAt when deleting', () => {
      const now = new Date();
      const author = Author.reconstitute({
        id: 5,
        firstname: 'Del',
        lastname: 'Me',
        createdAt: now,
        updatedAt: now,
      });
      author.delete();
      expect(author.deletedAt).toBeInstanceOf(Date);
      expect(author.updatedAt).toBe(author.deletedAt);
    });

    it('should throw if already deleted', () => {
      const now = new Date();
      const deletedTime = new Date(now.getTime() + 1000);
      const author = Author.reconstitute({
        id: 7,
        firstname: 'X',
        lastname: 'Y',
        createdAt: now,
        updatedAt: now,
        deletedAt: deletedTime,
      });
      expect(() => author.delete()).toThrow(
        `Author with id ${author.id} is already deleted`,
      );
    });
  });
});
