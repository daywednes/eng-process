import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('portfolio_snapshots')
export class PortfolioSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'total_value', type: 'decimal', precision: 20, scale: 4 })
  totalValue: number;

  @Column({ name: 'cash_balance', type: 'decimal', precision: 20, scale: 4, nullable: true })
  cashBalance: number;

  @Column({ name: 'total_pl', type: 'decimal', precision: 20, scale: 4, nullable: true })
  totalPl: number;

  @Column({ name: 'total_pl_percent', type: 'decimal', precision: 10, scale: 4, nullable: true })
  totalPlPercent: number;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.snapshots)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

