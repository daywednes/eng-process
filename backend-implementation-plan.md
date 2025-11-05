# Jaspers AI - Backend Implementation Plan

## Overview

**Framework:** NestJS (TypeScript)  
**Database:** PostgreSQL with TypeORM  
**Authentication:** JWT with Passport  
**API Style:** RESTful + Server-Sent Events (SSE) for streaming  
**External APIs:** Alpaca, IBKR, Yahoo Finance, Finnhub, SEC EDGAR, Anthropic Claude

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   ├── config/                          # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── api-keys.config.ts
│   ├── common/                          # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── rate-limit.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   │       ├── encryption.util.ts
│   │       ├── date.util.ts
│   │       └── response.util.ts
│   ├── entities/                        # TypeORM entities
│   │   ├── user.entity.ts
│   │   ├── user-settings.entity.ts
│   │   ├── brokerage-connection.entity.ts
│   │   ├── portfolio-holding.entity.ts
│   │   ├── portfolio-snapshot.entity.ts
│   │   ├── chat-session.entity.ts
│   │   ├── chat-message.entity.ts
│   │   ├── message-tool-call.entity.ts
│   │   ├── stock-quote-cache.entity.ts
│   │   ├── company-info-cache.entity.ts
│   │   ├── stock-news-cache.entity.ts
│   │   ├── edgar-filing-cache.entity.ts
│   │   ├── api-usage-log.entity.ts
│   │   └── audit-log.entity.ts
│   ├── modules/
│   │   ├── auth/                        # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── refresh-token.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   └── change-password.dto.ts
│   │   │   └── guards/
│   │   │       └── local-auth.guard.ts
│   │   ├── users/                       # User management module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   └── dto/
│   │   │       ├── update-user.dto.ts
│   │   │       └── update-settings.dto.ts
│   │   ├── brokerages/                  # Brokerage integration module
│   │   │   ├── brokerages.module.ts
│   │   │   ├── brokerages.controller.ts
│   │   │   ├── brokerages.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── alpaca.service.ts
│   │   │   │   ├── ibkr.service.ts
│   │   │   │   └── brokerage-provider.interface.ts
│   │   │   ├── dto/
│   │   │   │   ├── connect-brokerage.dto.ts
│   │   │   │   └── sync-brokerage.dto.ts
│   │   │   └── types/
│   │   │       ├── position.type.ts
│   │   │       └── account.type.ts
│   │   ├── portfolio/                   # Portfolio management module
│   │   │   ├── portfolio.module.ts
│   │   │   ├── portfolio.controller.ts
│   │   │   ├── portfolio.service.ts
│   │   │   ├── portfolio-sync.service.ts
│   │   │   ├── portfolio-snapshot.service.ts
│   │   │   ├── dto/
│   │   │   │   └── portfolio-query.dto.ts
│   │   │   └── types/
│   │   │       ├── portfolio-summary.type.ts
│   │   │       └── holding-detail.type.ts
│   │   ├── financial-data/              # Financial data module
│   │   │   ├── financial-data.module.ts
│   │   │   ├── stocks.controller.ts
│   │   │   ├── edgar.controller.ts
│   │   │   ├── news.controller.ts
│   │   │   ├── providers/
│   │   │   │   ├── yahoo-finance.service.ts
│   │   │   │   ├── finnhub.service.ts
│   │   │   │   ├── edgar.service.ts
│   │   │   │   └── data-provider.interface.ts
│   │   │   ├── cache/
│   │   │   │   ├── quote-cache.service.ts
│   │   │   │   ├── company-cache.service.ts
│   │   │   │   ├── news-cache.service.ts
│   │   │   │   └── edgar-cache.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── quote-query.dto.ts
│   │   │   │   ├── history-query.dto.ts
│   │   │   │   └── filing-search.dto.ts
│   │   │   └── types/
│   │   │       ├── quote.type.ts
│   │   │       ├── company-info.type.ts
│   │   │       └── news-article.type.ts
│   │   ├── chat/                        # Chat & AI module
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── claude.service.ts
│   │   │   ├── rag/
│   │   │   │   ├── intent-parser.service.ts
│   │   │   │   ├── context-builder.service.ts
│   │   │   │   └── citation-generator.service.ts
│   │   │   ├── tools/
│   │   │   │   ├── tool-executor.service.ts
│   │   │   │   ├── portfolio-tool.ts
│   │   │   │   ├── quote-tool.ts
│   │   │   │   ├── news-tool.ts
│   │   │   │   └── edgar-tool.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-session.dto.ts
│   │   │   │   ├── send-message.dto.ts
│   │   │   │   └── update-session.dto.ts
│   │   │   └── types/
│   │   │       ├── tool-definition.type.ts
│   │   │       └── citation.type.ts
│   │   ├── analytics/                   # Analytics & monitoring module
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── api-usage.service.ts
│   │   │   └── dto/
│   │   │       └── usage-query.dto.ts
│   │   └── health/                      # Health check module
│   │       ├── health.module.ts
│   │       ├── health.controller.ts
│   │       └── indicators/
│   │           ├── database.indicator.ts
│   │           ├── external-api.indicator.ts
│   │           └── claude.indicator.ts
│   └── migrations/                      # Database migrations
│       ├── 001-create-users.ts
│       ├── 002-create-brokerage-connections.ts
│       ├── 003-create-portfolio-tables.ts
│       ├── 004-create-chat-tables.ts
│       ├── 005-create-cache-tables.ts
│       └── 006-create-analytics-tables.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1: Project Setup & Infrastructure (Week 1)

### 1.1 Initialize Project

**Tasks:**
- [ ] Create NestJS project: `nest new backend`
- [ ] Set up Git repository and `.gitignore`
- [ ] Configure ESLint and Prettier
- [ ] Set up TypeScript strict mode
- [ ] Create Docker Compose for PostgreSQL

**Files to create:**
- `.env.example` - Template for environment variables
- `docker-compose.yml` - PostgreSQL, Redis (optional)
- `.eslintrc.js` - Linting rules
- `.prettierrc` - Code formatting rules

**Environment Variables:**
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=jaspers_ai

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
ALPACA_CLIENT_ID=
ALPACA_CLIENT_SECRET=
ALPACA_REDIRECT_URI=http://localhost:3000/api/brokerages/callback
ALPACA_API_BASE=https://paper-api.alpaca.markets

IBKR_GATEWAY_URL=https://localhost:5000

YAHOO_FINANCE_API_KEY=
FINNHUB_API_KEY=

ANTHROPIC_API_KEY=

# App
PORT=3000
NODE_ENV=development
ENCRYPTION_KEY=32-byte-hex-key-for-aes-256
```

### 1.2 Install Core Dependencies

```bash
# NestJS core
npm install @nestjs/common @nestjs/core @nestjs/platform-express

# Database
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config

# Authentication
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt
npm install -D @types/bcrypt @types/passport-jwt

# Validation
npm install class-validator class-transformer

# HTTP client
npm install axios

# Anthropic Claude
npm install @anthropic-ai/sdk

# Caching (optional but recommended)
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-store redis

# Rate limiting
npm install @nestjs/throttler

# Health checks
npm install @nestjs/terminus

# Scheduling (for cron jobs)
npm install @nestjs/schedule

# Utilities
npm install dayjs
npm install crypto-js
npm install -D @types/crypto-js

# Development
npm install -D @types/node
npm install -D @nestjs/cli
```

### 1.3 Database Setup

**Tasks:**
- [ ] Start PostgreSQL via Docker Compose
- [ ] Configure TypeORM in `app.module.ts`
- [ ] Set up migration scripts
- [ ] Create initial migration for enums

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: jaspers_ai
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Phase 2: Core Entities & Database Layer (Week 1-2)

### 2.1 Create TypeORM Entities

**Priority order:**
1. `user.entity.ts` - Core user model
2. `user-settings.entity.ts` - User preferences
3. `brokerage-connection.entity.ts` - Brokerage credentials
4. `portfolio-holding.entity.ts` - Holdings data
5. `portfolio-snapshot.entity.ts` - Daily snapshots
6. `chat-session.entity.ts` - Chat sessions
7. `chat-message.entity.ts` - Messages
8. `message-tool-call.entity.ts` - Tool call tracking
9. Cache entities (quotes, company info, news, EDGAR)
10. Logging entities (API usage, audit logs)

**Example entity structure:**
```typescript
// entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ length: 100, nullable: true })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // Relations
  @OneToMany(() => BrokerageConnection, connection => connection.user)
  brokerageConnections: BrokerageConnection[];

  @OneToMany(() => PortfolioHolding, holding => holding.user)
  holdings: PortfolioHolding[];
}
```

### 2.2 Create Database Migrations

**Tasks:**
- [ ] Generate migrations from entities
- [ ] Create enum types in PostgreSQL
- [ ] Add indexes for performance
- [ ] Add constraints and foreign keys
- [ ] Test migrations up/down

**Run migrations:**
```bash
npm run migration:generate -- -n InitialSchema
npm run migration:run
```

---

## Phase 3: Authentication Module (Week 2)

### 3.1 Build Auth Service

**Files:**
- `modules/auth/auth.service.ts` - Registration, login, token management
- `modules/auth/strategies/jwt.strategy.ts` - JWT validation
- `modules/auth/guards/jwt-auth.guard.ts` - Route protection
- `modules/auth/dto/register.dto.ts` - Validation schemas

**Key methods:**
```typescript
// auth.service.ts
async register(dto: RegisterDto): Promise<{ user: User; tokens: Tokens }>
async login(dto: LoginDto): Promise<{ user: User; tokens: Tokens }>
async refreshToken(refreshToken: string): Promise<Tokens>
async validateUser(email: string, password: string): Promise<User>
async changePassword(userId: string, dto: ChangePasswordDto): Promise<void>
```

### 3.2 Implement JWT Strategy

**Features:**
- Access token (15 min expiry)
- Refresh token (7 day expiry)
- Token blacklisting on logout
- Bcrypt password hashing (10 rounds)

### 3.3 Create Auth Endpoints

**Routes:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `POST /api/auth/change-password`

### 3.4 Add Audit Logging

**Tasks:**
- [ ] Create audit log interceptor
- [ ] Log all auth events
- [ ] Track IP addresses and user agents
- [ ] Store in `audit_logs` table

---

## Phase 4: Brokerage Integration Module (Week 3)

### 4.1 Create Brokerage Provider Interface

```typescript
// brokerages/providers/brokerage-provider.interface.ts
export interface IBrokerageProvider {
  connect(userId: string, credentials: any): Promise<BrokerageConnection>;
  disconnect(connectionId: string): Promise<void>;
  getAccount(connection: BrokerageConnection): Promise<Account>;
  getPositions(connection: BrokerageConnection): Promise<Position[]>;
  refreshToken(connection: BrokerageConnection): Promise<void>;
  healthCheck(connection: BrokerageConnection): Promise<boolean>;
}
```

### 4.2 Implement Alpaca Service

**File:** `brokerages/providers/alpaca.service.ts`

**Methods:**
```typescript
async initiateOAuth(userId: string): Promise<{ authUrl: string, state: string }>
async handleCallback(code: string, state: string): Promise<BrokerageConnection>
async getPositions(connection: BrokerageConnection): Promise<Position[]>
async getAccount(connection: BrokerageConnection): Promise<Account>
async refreshAccessToken(connection: BrokerageConnection): Promise<void>
```

**Features:**
- OAuth 2.0 with PKCE flow
- Automatic token refresh
- Rate limiting handling
- Error retry logic

### 4.3 Implement IBKR Service (Phase 3 - Optional for MVP)

**File:** `brokerages/providers/ibkr.service.ts`

**Methods:**
```typescript
async authenticate(userId: string, credentials: any): Promise<BrokerageConnection>
async tickleSession(connection: BrokerageConnection): Promise<void>
async getPositions(connection: BrokerageConnection): Promise<Position[]>
async getAccounts(connection: BrokerageConnection): Promise<Account[]>
```

### 4.4 Encryption Utility

**File:** `common/utils/encryption.util.ts`

```typescript
export class EncryptionUtil {
  static encrypt(plaintext: string): string {
    // AES-256 encryption
  }
  
  static decrypt(ciphertext: string): string {
    // AES-256 decryption
  }
}
```

### 4.5 Create Brokerage Endpoints

**Routes:**
- `GET /api/brokerages` - List providers
- `GET /api/brokerages/connections` - User's connections
- `POST /api/brokerages/connect` - Initiate connection
- `GET /api/brokerages/callback` - OAuth callback
- `DELETE /api/brokerages/connections/:id` - Disconnect
- `POST /api/brokerages/connections/:id/sync` - Manual sync
- `GET /api/brokerages/connections/:id/status` - Health check

---

## Phase 5: Portfolio Module (Week 4)

### 5.1 Portfolio Aggregation Service

**File:** `portfolio/portfolio.service.ts`

**Methods:**
```typescript
async getSummary(userId: string): Promise<PortfolioSummary>
async getHoldings(userId: string): Promise<HoldingDetail[]>
async getHolding(userId: string, symbol: string): Promise<HoldingDetail>
async getPerformance(userId: string, range: DateRange): Promise<PerformanceData>
async getSnapshots(userId: string, range: DateRange): Promise<PortfolioSnapshot[]>
async getAllocation(userId: string): Promise<AllocationBreakdown>
```

**Business Logic:**
- Aggregate holdings across all connected brokerages
- Deduplicate same symbols from different brokers
- Calculate total P&L, allocation percentages
- Handle partial failures (one brokerage down)
- Cache results for 30 seconds

### 5.2 Portfolio Sync Service

**File:** `portfolio/portfolio-sync.service.ts`

**Methods:**
```typescript
async syncAll(userId: string): Promise<SyncResult>
async syncConnection(connectionId: string): Promise<SyncResult>
async scheduledSync(): Promise<void> // Cron job
```

**Features:**
- Cron job every 15 minutes during market hours (9:30 AM - 4 PM ET)
- Batch processing for multiple users
- Error handling and retry logic
- Update `last_sync_at` timestamp
- Store sync errors in database

### 5.3 Snapshot Service

**File:** `portfolio/portfolio-snapshot.service.ts`

**Methods:**
```typescript
async createSnapshot(userId: string): Promise<PortfolioSnapshot>
async scheduledSnapshots(): Promise<void> // Daily at market close
```

**Features:**
- Create daily snapshot at 4 PM ET
- Store total value, P&L, cash balance
- Use for performance charting

### 5.4 Create Portfolio Endpoints

**Routes:**
- `GET /api/portfolio/summary`
- `GET /api/portfolio/holdings`
- `GET /api/portfolio/holdings/:symbol`
- `GET /api/portfolio/performance`
- `GET /api/portfolio/snapshots`
- `GET /api/portfolio/allocation`
- `POST /api/portfolio/sync`

---

## Phase 6: Financial Data Module (Week 5)

### 6.1 Create Data Provider Services

**Yahoo Finance Service:**
```typescript
// financial-data/providers/yahoo-finance.service.ts
async getQuote(symbol: string): Promise<Quote>
async getBatchQuotes(symbols: string[]): Promise<Quote[]>
async getHistoricalPrices(symbol: string, range: DateRange): Promise<OHLCV[]>
async getCompanyInfo(symbol: string): Promise<CompanyInfo>
async getNews(symbol: string, limit: number): Promise<NewsArticle[]>
```

**Finnhub Service:**
```typescript
// financial-data/providers/finnhub.service.ts
async getQuote(symbol: string): Promise<Quote>
async getCompanyProfile(symbol: string): Promise<CompanyInfo>
async getEarnings(symbol: string): Promise<Earnings[]>
async getNews(symbol: string, limit: number): Promise<NewsArticle[]>
```

**EDGAR Service:**
```typescript
// financial-data/providers/edgar.service.ts
async searchFilings(params: FilingSearchParams): Promise<Filing[]>
async getFilingsBySymbol(symbol: string): Promise<Filing[]>
async getFilingsByCIK(cik: string): Promise<Filing[]>
async getFilingContent(accessionNumber: string): Promise<string>
async extractSections(filingText: string): Promise<ExtractedSections>
```

### 6.2 Implement Caching Layer

**Cache Services:**
- `quote-cache.service.ts` - 1-min TTL during market hours
- `company-cache.service.ts` - 24-hour TTL
- `news-cache.service.ts` - 15-min TTL
- `edgar-cache.service.ts` - Permanent cache

**Strategy:**
1. Check cache first
2. If miss or expired, fetch from API
3. Store in database cache table
4. Use Redis for hot data (optional)

### 6.3 Data Normalization

**Create standardized types:**
```typescript
export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: 'yahoo' | 'finnhub';
}
```

### 6.4 Create Financial Data Endpoints

**Routes:**
- `GET /api/stocks/quote/:symbol`
- `POST /api/stocks/quotes` (batch)
- `GET /api/stocks/:symbol/history`
- `GET /api/stocks/:symbol/info`
- `GET /api/stocks/:symbol/metrics`
- `GET /api/stocks/:symbol/earnings`
- `GET /api/stocks/:symbol/news`
- `GET /api/news`
- `GET /api/edgar/filings/:symbol`
- `GET /api/edgar/filing/:accession`
- `GET /api/edgar/search`

---

## Phase 7: Chat & AI Module (Week 6-7)

### 7.1 Claude Service

**File:** `chat/claude.service.ts`

**Methods:**
```typescript
async sendMessage(params: {
  messages: Message[];
  tools: Tool[];
  system: string;
}): Promise<ClaudeResponse>

async streamMessage(params: {
  messages: Message[];
  tools: Tool[];
  system: string;
}): AsyncGenerator<ClaudeStreamChunk>
```

**Features:**
- Use `claude-3-5-sonnet-20241022` model
- Tool calling support
- Streaming responses
- Token usage tracking
- Error handling

### 7.2 RAG Pipeline

**Intent Parser:**
```typescript
// chat/rag/intent-parser.service.ts
async parseIntent(query: string): Promise<Intent> {
  // Extract ticker symbols (AAPL, "my tech stocks")
  // Identify time ranges ("this week", "last quarter")
  // Determine question type (portfolio, market, research)
}
```

**Context Builder:**
```typescript
// chat/rag/context-builder.service.ts
async buildContext(userId: string, intent: Intent): Promise<Context> {
  // Fetch relevant portfolio holdings
  // Get stock quotes for mentioned symbols
  // Retrieve recent news if needed
  // Include EDGAR filings if relevant
  // Structure data for Claude
}
```

**Citation Generator:**
```typescript
// chat/rag/citation-generator.service.ts
generateCitations(toolCalls: ToolCall[]): Citation[] {
  // Track all data sources used
  // Generate formatted citation strings
  // Create URLs where applicable
}
```

### 7.3 Tool Definitions

**Create tool classes:**
- `tools/portfolio-tool.ts` - Get holdings, performance
- `tools/quote-tool.ts` - Get stock quotes
- `tools/news-tool.ts` - Search news
- `tools/edgar-tool.ts` - Search filings

**Example tool definition:**
```typescript
// tools/portfolio-tool.ts
export const portfolioTool: Tool = {
  name: 'get_portfolio_holdings',
  description: 'Retrieve the user\'s current portfolio holdings',
  input_schema: {
    type: 'object',
    properties: {
      symbols: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Filter by specific symbols'
      }
    }
  }
};
```

### 7.4 Tool Executor

**File:** `chat/tools/tool-executor.service.ts`

```typescript
async executeTool(
  toolName: string,
  toolInput: any,
  userId: string
): Promise<ToolOutput> {
  // Route to appropriate tool handler
  // Execute data retrieval
  // Track execution time
  // Log to message_tool_calls table
  // Return structured results
}
```

### 7.5 Chat Service

**File:** `chat/chat.service.ts`

**Methods:**
```typescript
async createSession(userId: string, title?: string): Promise<ChatSession>
async getSessions(userId: string): Promise<ChatSession[]>
async getMessages(sessionId: string): Promise<ChatMessage[]>
async sendMessage(sessionId: string, content: string): Promise<ChatMessage>
async streamMessage(sessionId: string, content: string): AsyncGenerator<StreamChunk>
async updateSession(sessionId: string, updates: any): Promise<ChatSession>
async deleteSession(sessionId: string): Promise<void>
```

**Message flow:**
1. Parse user intent
2. Build context from portfolio/market data
3. Prepare Claude request with tools
4. Send to Claude API
5. Execute any tool calls
6. Return final response with citations
7. Store message and tool calls in DB
8. Track tokens and processing time

### 7.6 Create Chat Endpoints

**Routes:**
- `POST /api/chat/sessions`
- `GET /api/chat/sessions`
- `GET /api/chat/sessions/:id`
- `PATCH /api/chat/sessions/:id`
- `DELETE /api/chat/sessions/:id`
- `GET /api/chat/sessions/:id/messages`
- `POST /api/chat/sessions/:id/messages`
- `GET /api/chat/sessions/:id/messages/stream` (SSE)

---

## Phase 8: Analytics & Monitoring (Week 8)

### 8.1 API Usage Tracking

**File:** `analytics/api-usage.service.ts`

**Methods:**
```typescript
async logApiCall(params: {
  userId: string;
  provider: ApiProvider;
  endpoint: string;
  tokensUsed?: number;
  costUsd?: number;
  responseTimeMs: number;
  statusCode: number;
}): Promise<void>

async getUsageStats(userId: string, range: DateRange): Promise<UsageStats>
async estimateCosts(userId: string, range: DateRange): Promise<CostBreakdown>
```

### 8.2 Audit Logging

**File:** `analytics/audit.service.ts`

**Methods:**
```typescript
async logAction(params: {
  userId: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
}): Promise<void>

async getAuditLogs(userId: string, filters: any): Promise<AuditLog[]>
```

**Auto-log events:**
- Login/logout
- Brokerage connect/disconnect
- Portfolio sync
- Chat session creation
- Settings changes
- Password changes

### 8.3 Health Checks

**File:** `health/health.controller.ts`

**Endpoints:**
- `GET /api/health` - Overall health
- `GET /api/health/database` - Database connectivity
- `GET /api/health/external-apis` - External API status

**Checks:**
- Database connection
- Alpaca API availability
- Yahoo Finance availability
- Finnhub API availability
- Claude API availability
- Disk space
- Memory usage

### 8.4 Create Analytics Endpoints

**Routes:**
- `GET /api/analytics/usage`
- `GET /api/analytics/costs`
- `GET /api/audit/logs`
- `GET /api/health`

---

## Phase 9: Cross-Cutting Concerns (Week 8)

### 9.1 Global Exception Filter

**File:** `common/filters/http-exception.filter.ts`

**Features:**
- Catch all exceptions
- Format error responses consistently
- Log errors with stack traces
- Hide sensitive information in production

### 9.2 Logging Interceptor

**File:** `common/interceptors/logging.interceptor.ts`

**Features:**
- Log all incoming requests
- Log response times
- Track request/response sizes
- Include correlation IDs

### 9.3 Response Transformation

**File:** `common/interceptors/transform.interceptor.ts`

**Transform all responses:**
```typescript
{
  success: true,
  data: { ... },
  meta?: { ... }
}
```

### 9.4 Rate Limiting

**Setup:**
- Use `@nestjs/throttler`
- Global: 1000 req/hour per user
- Auth login: 5 attempts per 15 min
- Chat: 10 messages/min per session

### 9.5 Validation

**Setup:**
- Use `class-validator` globally
- Validate all DTOs
- Strip unknown properties
- Transform types automatically

---

## Phase 10: Testing (Ongoing)

### 10.1 Unit Tests

**Coverage targets:**
- Services: 80%+
- Utilities: 90%+

**Key tests:**
- Auth service (registration, login, token validation)
- Portfolio calculations (P&L, allocation)
- Encryption utilities
- RAG pipeline components

### 10.2 Integration Tests

**Test:**
- Database operations
- External API integrations (mocked)
- Module interactions

### 10.3 E2E Tests

**Critical flows:**
- User registration → brokerage connection → portfolio sync
- Login → create chat → send message → receive AI response
- Portfolio data retrieval and calculations

---

## Phase 11: Deployment Preparation (Week 9)

### 11.1 Environment Setup

**Environments:**
- Development (local)
- Staging (testing)
- Production

### 11.2 Docker Configuration

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

### 11.3 CI/CD Pipeline

**GitHub Actions:**
- Lint and format check
- Run tests
- Build Docker image
- Deploy to staging on PR merge
- Deploy to production on release tag

### 11.4 Production Database

**Options:**
- AWS RDS PostgreSQL
- Supabase
- Railway
- Render

**Setup:**
- Automated backups
- SSL connections
- Connection pooling

### 11.5 Monitoring & Logging

**Setup:**
- Application logs (Winston or Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic or Datadog)
- Uptime monitoring (UptimeRobot)

---

## Development Workflow

### Daily Development

```bash
# Start database
docker-compose up -d

# Run migrations
npm run migration:run

# Start dev server
npm run start:dev

# Run tests
npm run test:watch

# Format code
npm run format

# Lint code
npm run lint
```

### Creating a New Module

1. Generate module: `nest g module modules/module-name`
2. Generate service: `nest g service modules/module-name`
3. Generate controller: `nest g controller modules/module-name`
4. Create DTOs in `dto/` folder
5. Create tests
6. Register in `app.module.ts`

---

## Testing Strategy

### Unit Tests
- Test individual services in isolation
- Mock all dependencies
- Focus on business logic

### Integration Tests
- Test database operations
- Test module interactions
- Use test database

### E2E Tests
- Test complete API flows
- Use test database with seed data
- Test authentication flow
- Test error scenarios

---

## Performance Optimization

### Database
- Add indexes on frequently queried columns
- Use query optimization
- Implement connection pooling
- Use prepared statements

### Caching
- Cache stock quotes (1-min TTL)
- Cache company info (24-hour TTL)
- Cache portfolio summary (30-sec TTL)
- Use Redis for hot data

### API Optimization
- Batch requests where possible
- Implement pagination
- Use compression (gzip)
- Optimize JSON serialization

---

## Security Checklist

- [ ] All passwords hashed with bcrypt
- [ ] JWT tokens with short expiry
- [ ] Brokerage tokens encrypted at rest (AES-256)
- [ ] HTTPS only in production
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use TypeORM properly)
- [ ] XSS prevention (sanitize outputs)
- [ ] CSRF protection for state-changing operations
- [ ] Environment variables never committed
- [ ] Audit logging for sensitive operations
- [ ] Secure headers (Helmet.js)

---

## Success Metrics

### Performance
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Chat response time < 5 seconds
- Portfolio sync time < 30 seconds

### Reliability
- Uptime > 99.5%
- Error rate < 1%
- Successful sync rate > 95%

### Quality
- Test coverage > 80%
- Zero critical security vulnerabilities
- All endpoints documented

---

## Next Steps After Backend MVP

1. **Advanced Features:**
   - Real-time WebSocket updates
   - Advanced portfolio analytics
   - Multi-user support (family accounts)
   - Trading capabilities (buy/sell)

2. **Scalability:**
   - Implement job queue (Bull/BullMQ)
   - Add Redis caching layer
   - Implement rate limiting per user tier
   - Database read replicas

3. **Business Features:**
   - User billing/subscriptions
   - Usage quotas
   - Admin dashboard
   - Analytics dashboard

---

## Resources & Documentation

### NestJS
- [Official Docs](https://docs.nestjs.com/)
- [TypeORM Guide](https://typeorm.io/)
- [Authentication Guide](https://docs.nestjs.com/security/authentication)

### External APIs
- [Alpaca API Docs](https://alpaca.markets/docs/)
- [IBKR Client Portal API](https://www.interactivebrokers.com/api/doc.html)
- [Finnhub API Docs](https://finnhub.io/docs/api)
- [SEC EDGAR API](https://www.sec.gov/edgar/sec-api-documentation)
- [Anthropic Claude API](https://docs.anthropic.com/)

### Best Practices
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [REST API Design](https://restfulapi.net/)
- [Database Design](https://www.postgresql.org/docs/current/tutorial.html)

