import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BrokerageConnection } from './brokerage-connection.entity';

@Entity('portfolio_holdings')
export class PortfolioHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'brokerage_connection_id', type: 'uuid' })
  brokerageConnectionId: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ name: 'asset_type', length: 50, default: 'stock' })
  assetType: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  quantity: number;

  @Column({ name: 'average_cost', type: 'decimal', precision: 20, scale: 4, nullable: true })
  averageCost: number;

  @Column({ name: 'current_price', type: 'decimal', precision: 20, scale: 4, nullable: true })
  currentPrice: number;

  @Column({ name: 'market_value', type: 'decimal', precision: 20, scale: 4, nullable: true })
  marketValue: number;

  @Column({ name: 'unrealized_pl', type: 'decimal', precision: 20, scale: 4, nullable: true })
  unrealizedPl: number;

  @Column({
    name: 'unrealized_pl_percent',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  unrealizedPlPercent: number;

  @Column({ name: 'cost_basis', type: 'decimal', precision: 20, scale: 4, nullable: true })
  costBasis: number;

  @Column({ name: 'last_synced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.holdings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BrokerageConnection, (connection) => connection.holdings)
  @JoinColumn({ name: 'brokerage_connection_id' })
  brokerageConnection: BrokerageConnection;
}
