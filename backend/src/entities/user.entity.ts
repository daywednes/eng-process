import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserSettings } from './user-settings.entity';
import { BrokerageConnection } from './brokerage-connection.entity';
import { PortfolioHolding } from './portfolio-holding.entity';
import { PortfolioSnapshot } from './portfolio-snapshot.entity';
import { ChatSession } from './chat-session.entity';
import { AuditLog } from './audit-log.entity';
import { ApiUsageLog } from './api-usage-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // Relations
  @OneToOne(() => UserSettings, (settings) => settings.user)
  settings: UserSettings;

  @OneToMany(() => BrokerageConnection, (connection) => connection.user)
  brokerageConnections: BrokerageConnection[];

  @OneToMany(() => PortfolioHolding, (holding) => holding.user)
  holdings: PortfolioHolding[];

  @OneToMany(() => PortfolioSnapshot, (snapshot) => snapshot.user)
  snapshots: PortfolioSnapshot[];

  @OneToMany(() => ChatSession, (session) => session.user)
  chatSessions: ChatSession[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @OneToMany(() => ApiUsageLog, (log) => log.user)
  apiUsageLogs: ApiUsageLog[];
}
