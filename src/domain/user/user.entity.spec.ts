import { User } from './user.entity';

describe('User Entity (DDD Domain)', () => {
  describe('create()', () => {
    it('should initialize a new User with undefined id and dates', () => {
      const user = User.create({
        username: 'johndoe',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        stripeCustomerId: 'cus_123',
      });
      expect(user.id).toBeUndefined();
      expect(user.username).toBe('johndoe');
      expect(user.firstname).toBe('John');
      expect(user.lastname).toBe('Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.stripeCustomerId).toBe('cus_123');
      expect(user.createdAt).toBeUndefined();
      expect(user.updatedAt).toBeUndefined();
      expect(user.deletedAt).toBeUndefined();
    });
  });

  describe('reconstitute()', () => {
    it('should rehydrate an existing User correctly', () => {
      const now = new Date();
      const user = User.reconstitute({
        id: 1,
        username: 'janedoe',
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane@example.com',
        stripeCustomerId: 'cus_456',
        createdAt: now,
        updatedAt: now,
      });

      expect(user.id).toBe(1);
      expect(user.username).toBe('janedoe');
      expect(user.firstname).toBe('Jane');
      expect(user.lastname).toBe('Smith');
      expect(user.email).toBe('jane@example.com');
      expect(user.stripeCustomerId).toBe('cus_456');
      expect(user.createdAt).toBe(now);
      expect(user.updatedAt).toBe(now);
      expect(user.deletedAt).toBeUndefined();
    });

    it('should include deletedAt if provided', () => {
      const now = new Date();
      const deleted = new Date(now.getTime() + 1000);
      const user = User.reconstitute({
        id: 2,
        username: 'alice',
        firstname: 'Alice',
        lastname: 'Wonder',
        email: 'alice@example.com',
        stripeCustomerId: 'cus_789',
        createdAt: now,
        updatedAt: now,
        deletedAt: deleted,
      });

      expect(user.deletedAt).toBe(deleted);
    });
  });

  describe('update()', () => {
    it('should update all fields and set updatedAt', () => {
      const user = User.create({
        username: 'olduser',
        firstname: 'Old',
        lastname: 'Name',
        email: 'old@example.com',
        stripeCustomerId: 'cus_old',
      });
      const before = user.updatedAt;
      user.update({
        username: 'newuser',
        firstname: 'New',
        lastname: 'Name',
        email: 'new@example.com',
        stripeCustomerId: 'cus_new',
      });
      expect(user.username).toBe('newuser');
      expect(user.firstname).toBe('New');
      expect(user.lastname).toBe('Name');
      expect(user.email).toBe('new@example.com');
      expect(user.stripeCustomerId).toBe('cus_new');
      expect(user.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(user.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });

    it('should throw when username is empty', () => {
      const user = User.create({
        username: 'user',
        firstname: 'First',
        lastname: 'Last',
        email: 'user@example.com',
        stripeCustomerId: 'cus_x',
      });
      expect(() =>
        user.update({
          username: '',
          firstname: 'First',
          lastname: 'Last',
          email: 'user@example.com',
          stripeCustomerId: 'cus_x',
        }),
      ).toThrow('username is required');
    });

    it('should throw when email is empty', () => {
      const user = User.create({
        username: 'user',
        firstname: 'First',
        lastname: 'Last',
        email: 'user@example.com',
        stripeCustomerId: 'cus_x',
      });
      expect(() =>
        user.update({
          username: 'user',
          firstname: 'First',
          lastname: 'Last',
          email: '',
          stripeCustomerId: 'cus_x',
        }),
      ).toThrow('email is required');
    });
  });

  describe('patch()', () => {
    it('should patch only provided fields and update updatedAt', () => {
      const user = User.create({
        username: 'patchuser',
        firstname: 'A',
        lastname: 'B',
        email: 'patch@example.com',
        stripeCustomerId: 'cus_patch',
      });
      user.patch({ firstname: 'X' });
      expect(user.firstname).toBe('X');
      expect(user.lastname).toBe('B');
      expect(user.updatedAt).toBeInstanceOf(Date);

      const oldUpdated = user.updatedAt!;
      user.patch({ lastname: 'Y' });
      expect(user.firstname).toBe('X');
      expect(user.lastname).toBe('Y');
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        oldUpdated.getTime(),
      );
    });

    it('should handle empty patch object (still set updatedAt)', () => {
      const user = User.create({
        username: 'patchuser',
        firstname: 'A',
        lastname: 'B',
        email: 'patch@example.com',
        stripeCustomerId: 'cus_patch',
      });
      const before = user.updatedAt;
      user.patch({});
      expect(user.firstname).toBe('A');
      expect(user.lastname).toBe('B');
      expect(user.updatedAt).toBeInstanceOf(Date);
      if (before) {
        expect(user.updatedAt!.getTime()).toBeGreaterThan(before.getTime());
      }
    });
  });

  describe('delete()', () => {
    it('should throw if id is undefined (not persisted)', () => {
      const user = User.create({
        username: 'willdelete',
        firstname: 'Will',
        lastname: 'Delete',
        email: 'will@delete.com',
        stripeCustomerId: 'cus_del',
      });
      expect(() => user.delete()).toThrow(
        'Cannot delete a User that has not been persisted',
      );
    });

    it('should set deletedAt and updatedAt when deleting', () => {
      const now = new Date();
      const user = User.reconstitute({
        id: 5,
        username: 'deluser',
        firstname: 'Del',
        lastname: 'Me',
        email: 'del@me.com',
        stripeCustomerId: 'cus_del',
        createdAt: now,
        updatedAt: now,
      });
      user.delete();
      expect(user.deletedAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBe(user.deletedAt);
    });

    it('should throw if already deleted', () => {
      const now = new Date();
      const deletedTime = new Date(now.getTime() + 1000);
      const user = User.reconstitute({
        id: 7,
        username: 'x',
        firstname: 'X',
        lastname: 'Y',
        email: 'x@y.com',
        stripeCustomerId: 'cus_x',
        createdAt: now,
        updatedAt: now,
        deletedAt: deletedTime,
      });
      expect(() => user.delete()).toThrow(
        `User with id ${user.id} is already deleted`,
      );
    });
  });
});
