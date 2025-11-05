import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity('message_tool_calls')
export class MessageToolCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @Column({ name: 'tool_name', length: 100 })
  toolName: string;

  @Column({ name: 'tool_input', type: 'jsonb' })
  toolInput: Record<string, any>;

  @Column({ name: 'tool_output', type: 'jsonb', nullable: true })
  toolOutput: Record<string, any>;

  @Column({ name: 'execution_time_ms', type: 'integer', nullable: true })
  executionTimeMs: number;

  @Column({ length: 50, default: 'success' })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ChatMessage, (message) => message.toolCalls)
  @JoinColumn({ name: 'message_id' })
  message: ChatMessage;
}

