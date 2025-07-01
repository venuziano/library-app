import { Injectable, NotFoundException } from '@nestjs/common';

/**
 * Helper to load an entity or throw a NotFoundException.
 */
@Injectable()
export class EntityChecker {
  async ensureExists<T>(
    loader: () => Promise<T | null>,
    notFoundMessage: string,
  ): Promise<T> {
    const entity = await loader();
    if (entity === null) {
      throw new NotFoundException(notFoundMessage);
    }
    return entity;
  }
}
