import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { UserOrm } from '../../user/typeorm/user.orm-entity';
import { TokenType } from 'src/domain/user-token/token-type.enum';

@Entity('user_token')
export class UserTokenOrm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'token_type', length: 30 })
  tokenType: TokenType;

  @Column({ name: 'code', length: 64 })
  code: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt?: Date;

  @ManyToOne(() => UserOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrm;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  createdAt: Date;
}
