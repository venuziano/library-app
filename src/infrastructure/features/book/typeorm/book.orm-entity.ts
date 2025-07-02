import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  RelationId,
} from 'typeorm';

import { CommonDatesEntity } from '../../../typeorm/shared/common-dates.orm-entity';
import { CategoryOrm } from '../../category/typeorm/category.orm-entity';
import { AuthorOrm } from '../../author/typeorm/author.orm-entity';

@Entity('book')
export class BookOrm extends CommonDatesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'title', length: 100 })
  title: string;

  @Column({ name: 'publisher', length: 100, nullable: true })
  publisher?: string;

  @Column({ name: 'publication_date', type: 'timestamp', nullable: true })
  publicationDate?: Date;

  @Column({ name: 'page_count', type: 'int', nullable: true })
  pageCount?: number;

  @ManyToMany(() => CategoryOrm, { eager: false })
  @JoinTable({
    name: 'book_categories',
    joinColumn: { name: 'book_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: CategoryOrm[];

  @ManyToMany(() => AuthorOrm, { eager: false })
  @JoinTable({
    name: 'book_author',
    joinColumn: { name: 'book_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'author_id', referencedColumnName: 'id' },
  })
  authors: AuthorOrm[];

  @RelationId((b: BookOrm) => b.categories)
  categoryIds: number[];

  @RelationId((b: BookOrm) => b.authors)
  authorIds: number[];
}
