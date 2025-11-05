import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { PortfolioHolding } from './portfolio-holding.entity';
import { ApiProvider } from './api-usage-log.entity';

@Entity('brokerage_connections')
export class BrokerageConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ApiProvider,
  })
  provider: ApiProvider;

  @Column({ name: 'account_id', length: 255, nullable: true })
  accountId: string;

  @Column({ name: 'access_token_encrypted', type: 'text' })
  accessTokenEncrypted: string;

  @Column({ name: 'refresh_token_encrypted', type: 'text', nullable: true })
  refreshTokenEncrypted: string;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ name: 'sync_status', length: 50, default: 'pending' })
  syncStatus: string;

  @Column({ name: 'sync_error_message', type: 'text', nullable: true })
  syncErrorMessage: string;

  @Column({ name: 'connected_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  connectedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.brokerageConnections)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PortfolioHolding, (holding) => holding.brokerageConnection)
  holdings: PortfolioHolding[];
}

