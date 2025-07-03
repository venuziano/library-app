import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { CommonDatesEntity } from '../../../typeorm/shared/common-dates.orm-entity';

@Entity('user')
export class UserOrm extends CommonDatesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'username', length: 40 })
  username: string;

  @Column({ name: 'firstname', length: 50, nullable: true })
  firstname?: string;

  @Column({ name: 'lastname', length: 50, nullable: true })
  lastname?: string;

  @Column({ name: 'email', length: 255, unique: true })
  email: string;

  @Column({ name: 'stripe_customer_id', length: 50, nullable: true })
  stripeCustomerId?: string;
}
