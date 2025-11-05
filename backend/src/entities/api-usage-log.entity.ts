import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ApiProvider {
  ALPACA = 'alpaca',
  IBKR = 'ibkr',
  ANTHROPIC = 'anthropic',
  YAHOO_FINANCE = 'yahoo_finance',
  FINNHUB = 'finnhub',
  EDGAR = 'edgar',
}

@Entity('api_usage_logs')
export class ApiUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({
    name: 'api_provider',
    type: 'enum',
    enum: ApiProvider,
  })
  apiProvider: ApiProvider;

  @Column({ length: 255, nullable: true })
  endpoint: string;

  @Column({ name: 'tokens_used', type: 'integer', nullable: true })
  tokensUsed: number;

  @Column({ name: 'cost_usd', type: 'decimal', precision: 10, scale: 6, nullable: true })
  costUsd: number;

  @Column({ name: 'response_time_ms', type: 'integer', nullable: true })
  responseTimeMs: number;

  @Column({ name: 'status_code', type: 'integer', nullable: true })
  statusCode: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.apiUsageLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
