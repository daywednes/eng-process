import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { MessageToolCall } from './message-tool-call.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ length: 20 })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  citations: Record<string, any>;

  @Column({ name: 'tokens_used', type: 'integer', nullable: true })
  tokensUsed: number;

  @Column({ name: 'model_used', length: 100, nullable: true })
  modelUsed: string;

  @Column({ name: 'processing_time_ms', type: 'integer', nullable: true })
  processingTimeMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ChatSession, (session) => session.messages)
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @OneToMany(() => MessageToolCall, (toolCall) => toolCall.message)
  toolCalls: MessageToolCall[];
}

