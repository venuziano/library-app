import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { CommonDatesEntity } from '../shared/common-dates.orm-entity';

@Entity('author')
export class AuthorOrm extends CommonDatesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'firstname', length: 50 })
  firstname: string;

  @Column({ name: 'lastname', length: 50 })
  lastname: string;
}
