/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NotFoundException } from '@nestjs/common';

import { EntityChecker } from './entity-checker.service';

describe('EntityChecker', () => {
  let checker: EntityChecker;

  beforeEach(() => {
    checker = new EntityChecker();
  });

  describe('ensureExists', () => {
    it('should return the entity when loader resolves a non-null value', async () => {
      const payload = { id: 123, name: 'Test' };
      const loader = jest.fn().mockResolvedValue(payload);
      const result = await checker.ensureExists(loader, 'Not found');
      expect(loader).toHaveBeenCalled();
      expect(result).toBe(payload);
    });

    it('should throw NotFoundException when loader resolves null', async () => {
      const loader = jest.fn().mockResolvedValue(null);
      const message = 'Entity missing';

      await expect(checker.ensureExists(loader, message)).rejects.toThrowError(
        new NotFoundException(message),
      );

      try {
        await checker.ensureExists(loader, message);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.message).toBe(message);
      }
    });

    it('should propagate loader rejections', async () => {
      const error = new Error('Loader failure');
      const loader = jest.fn().mockRejectedValue(error);

      await expect(checker.ensureExists(loader, 'Irrelevant')).rejects.toBe(
        error,
      );
    });
  });
});
