import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { CommonDatesEntity } from '../../../typeorm/shared/common-dates.orm-entity';

@Entity('category')
export class CategoryOrm extends CommonDatesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 40 })
  name: string;
}
