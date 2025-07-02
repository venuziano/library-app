import DataLoader from 'dataloader';
import { Injectable } from '@nestjs/common';
import { CategoryService } from 'src/application/category/category.service';
import { Category } from 'src/domain/category/category.entity';

@Injectable()
export class CategoryLoader {
  constructor(private readonly categoryService: CategoryService) {}

  private readonly loader = new DataLoader<number, Category | null>(
    async (ids: readonly number[]) => {
      const cats = await this.categoryService.findByIds([...ids]);
      return ids.map((id) => cats.find((c) => c.id === id) ?? null);
    },
  );

  load(id: number) {
    return this.loader.load(id);
  }

  loadMany(ids: number[]) {
    return this.loader.loadMany(ids);
  }
}
