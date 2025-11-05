import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1699000000000 implements MigrationInterface {
  name = 'InitialSchema1699000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "api_provider" AS ENUM (
        'alpaca', 
        'ibkr', 
        'anthropic', 
        'yahoo_finance', 
        'finnhub', 
        'edgar'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "audit_action" AS ENUM (
        'login', 
        'logout', 
        'register', 
        'connect_broker', 
        'disconnect_broker', 
        'sync_portfolio', 
        'create_chat_session', 
        'send_message', 
        'update_settings', 
        'password_change'
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) UNIQUE NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "first_name" varchar(100),
        "last_name" varchar(100),
        "is_active" boolean DEFAULT true,
        "email_verified" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "last_login_at" timestamp
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_created_at" ON "users" ("created_at")`);

    // Create user_settings table
    await queryRunner.query(`
      CREATE TABLE "user_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE,
        "currency" varchar(3) DEFAULT 'USD',
        "timezone" varchar(50) DEFAULT 'America/New_York',
        "notification_email" boolean DEFAULT true,
        "notification_portfolio_changes" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create brokerage_connections table
    await queryRunner.query(`
      CREATE TABLE "brokerage_connections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "provider" api_provider NOT NULL,
        "account_id" varchar(255),
        "access_token_encrypted" text NOT NULL,
        "refresh_token_encrypted" text,
        "token_expires_at" timestamp,
        "is_active" boolean DEFAULT true,
        "last_sync_at" timestamp,
        "sync_status" varchar(50) DEFAULT 'pending',
        "sync_error_message" text,
        "connected_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_brokerage_connections_user_id" ON "brokerage_connections" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_brokerage_connections_is_active" ON "brokerage_connections" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_brokerage_connections_user_provider" ON "brokerage_connections" ("user_id", "provider")`,
    );

    // Create portfolio_holdings table
    await queryRunner.query(`
      CREATE TABLE "portfolio_holdings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "brokerage_connection_id" uuid NOT NULL,
        "symbol" varchar(20) NOT NULL,
        "asset_type" varchar(50) DEFAULT 'stock',
        "quantity" decimal(20, 8) NOT NULL,
        "average_cost" decimal(20, 4),
        "current_price" decimal(20, 4),
        "market_value" decimal(20, 4),
        "unrealized_pl" decimal(20, 4),
        "unrealized_pl_percent" decimal(10, 4),
        "cost_basis" decimal(20, 4),
        "last_synced_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("brokerage_connection_id") REFERENCES "brokerage_connections"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_portfolio_holdings_user_id" ON "portfolio_holdings" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_portfolio_holdings_symbol" ON "portfolio_holdings" ("symbol")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_portfolio_holdings_user_symbol" ON "portfolio_holdings" ("user_id", "symbol")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_portfolio_holdings_brokerage" ON "portfolio_holdings" ("brokerage_connection_id")`,
    );

    // Create portfolio_snapshots table
    await queryRunner.query(`
      CREATE TABLE "portfolio_snapshots" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "total_value" decimal(20, 4) NOT NULL,
        "cash_balance" decimal(20, 4),
        "total_pl" decimal(20, 4),
        "total_pl_percent" decimal(10, 4),
        "snapshot_date" date NOT NULL,
        "created_at" timestamp DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_portfolio_snapshots_user_id" ON "portfolio_snapshots" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_portfolio_snapshots_snapshot_date" ON "portfolio_snapshots" ("snapshot_date")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_portfolio_snapshots_user_date" ON "portfolio_snapshots" ("user_id", "snapshot_date")`,
    );

    // Create chat_sessions table
    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "title" varchar(255),
        "is_archived" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_chat_sessions_user_id" ON "chat_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_sessions_created_at" ON "chat_sessions" ("created_at")`,
    );

    // Create chat_messages table
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "role" varchar(20) NOT NULL,
        "content" text NOT NULL,
        "citations" jsonb,
        "tokens_used" integer,
        "model_used" varchar(100),
        "processing_time_ms" integer,
        "created_at" timestamp DEFAULT now(),
        FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_session_id" ON "chat_messages" ("session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_created_at" ON "chat_messages" ("created_at")`,
    );

    // Create message_tool_calls table
    await queryRunner.query(`
      CREATE TABLE "message_tool_calls" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "message_id" uuid NOT NULL,
        "tool_name" varchar(100) NOT NULL,
        "tool_input" jsonb NOT NULL,
        "tool_output" jsonb,
        "execution_time_ms" integer,
        "status" varchar(50) DEFAULT 'success',
        "error_message" text,
        "created_at" timestamp DEFAULT now(),
        FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_message_tool_calls_message_id" ON "message_tool_calls" ("message_id")`,
    );

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "action" audit_action NOT NULL,
        "resource_type" varchar(50),
        "resource_id" uuid,
        "ip_address" varchar(50),
        "user_agent" text,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action")`);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );

    // Create api_usage_logs table
    await queryRunner.query(`
      CREATE TABLE "api_usage_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "api_provider" api_provider NOT NULL,
        "endpoint" varchar(255),
        "tokens_used" integer,
        "cost_usd" decimal(10, 6),
        "response_time_ms" integer,
        "status_code" integer,
        "created_at" timestamp DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_api_usage_logs_user_id" ON "api_usage_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_api_usage_logs_api_provider" ON "api_usage_logs" ("api_provider")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_api_usage_logs_created_at" ON "api_usage_logs" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "api_usage_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "message_tool_calls"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolio_snapshots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolio_holdings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brokerage_connections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_action"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "api_provider"`);
  }
}
