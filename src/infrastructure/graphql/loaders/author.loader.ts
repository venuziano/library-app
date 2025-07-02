import DataLoader from 'dataloader';
import { Injectable } from '@nestjs/common';

import { AuthorService } from 'src/application/author/author.service';
import { Author } from 'src/domain/author/author.entity';

@Injectable()
export class AuthorLoader {
  constructor(private readonly authorService: AuthorService) {}

  private readonly loader = new DataLoader<number, Author | null>(
    async (ids: readonly number[]) => {
      const authors = await this.authorService.findByIds([...ids]);
      return ids.map((id) => authors.find((a) => a.id === id) ?? null);
    },
  );

  load(id: number) {
    return this.loader.load(id);
  }

  loadMany(ids: number[]) {
    return this.loader.loadMany(ids);
  }
}
