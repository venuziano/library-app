import { Category } from './category.entity';

describe('Category Entity (DDD Domain)', () => {
  describe('create()', () => {
    it('should initialize a new Category with undefined id and dates', () => {
      const category = Category.create({ name: 'Fiction' });
      expect(category.id).toBeUndefined();
      expect(category.name).toBe('Fiction');
      expect(category.createdAt).toBeUndefined();
      expect(category.updatedAt).toBeUndefined();
      expect(category.deletedAt).toBeUndefined();
    });
  });

  describe('reconstitute()', () => {
    it('should rehydrate an existing Category correctly', () => {
      const now = new Date();
      const category = Category.reconstitute({
        id: 1,
        name: 'Science Fiction',
        createdAt: now,
        updatedAt: now,
      });

      expect(category.id).toBe(1);
      expect(category.name).toBe('Science Fiction');
      expect(category.createdAt).toBe(now);
      expect(category.updatedAt).toBe(now);
      expect(category.deletedAt).toBeUndefined();
    });

    it('should include deletedAt if provided', () => {
      const now = new Date();
      const deleted = new Date(now.getTime() + 1000);
      const category = Category.reconstitute({
        id: 2,
        name: 'Mystery',
        createdAt: now,
        updatedAt: now,
        deletedAt: deleted,
      });

      expect(category.deletedAt).toBe(deleted);
    });
  });

  describe('update()', () => {
    it('should update name and set updatedAt', () => {
      const category = Category.create({ name: 'Old Category' });
      const before = category.updatedAt;
      category.update('New Category');
      expect(category.name).toBe('New Category');
      expect(category.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(category.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });

    it('should throw when name is empty', () => {
      const category = Category.create({ name: 'Valid Category' });
      expect(() => category.update('')).toThrow('name cannot be empty');
    });
  });

  describe('patch()', () => {
    it('should patch only provided fields and update updatedAt', () => {
      const category = Category.create({ name: 'Original Name' });
      category.patch({ name: 'Updated Name' });
      expect(category.name).toBe('Updated Name');
      expect(category.updatedAt).toBeInstanceOf(Date);

      const oldUpdated = category.updatedAt!;
      category.patch({ name: 'Final Name' });
      expect(category.name).toBe('Final Name');
      expect(category.updatedAt).toBeInstanceOf(Date);
      expect(category.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        oldUpdated.getTime(),
      );
    });

    it('should handle empty patch object (still set updatedAt)', () => {
      const category = Category.create({ name: 'Unchanged Name' });
      const before = category.updatedAt;
      category.patch({});
      expect(category.name).toBe('Unchanged Name');
      expect(category.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(category.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });
  });

  describe('delete()', () => {
    it('should throw if id is undefined (not persisted)', () => {
      const category = Category.create({ name: 'Will Delete' });
      expect(() => category.delete()).toThrow(
        'Cannot delete an Category that has not been persisted',
      );
    });

    it('should set deletedAt and updatedAt when deleting', () => {
      const now = new Date();
      const category = Category.reconstitute({
        id: 5,
        name: 'Delete Me',
        createdAt: now,
        updatedAt: now,
      });
      category.delete();
      expect(category.deletedAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBe(category.deletedAt);
    });

    it('should throw if already deleted', () => {
      const now = new Date();
      const deletedTime = new Date(now.getTime() + 1000);
      const category = Category.reconstitute({
        id: 7,
        name: 'Already Deleted',
        createdAt: now,
        updatedAt: now,
        deletedAt: deletedTime,
      });
      expect(() => category.delete()).toThrow(
        `Category with id ${category.id} is already deleted`,
      );
    });
  });
}); 