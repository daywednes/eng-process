<!-- a5523bbf-6b3e-4d1b-9931-998e6c29696e 921cc5bf-473c-41a5-ad2a-27ada7fd23fd -->
# Jaspers AI - MVP Implementation Plan

## Tech Stack

- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js (React, TypeScript)
- **Database**: PostgreSQL
- **LLM**: Anthropic Claude
- **Brokerages**: Alpaca, Interactive Brokers
- **Financial Data**: Yahoo Finance, Finnhub, SEC EDGAR

## Phase 1: Infrastructure & Setup

### 1.1 Project Structure

- Initialize monorepo with `/backend` (NestJS) and `/frontend` (Next.js)
- Set up TypeScript configs, ESLint, Prettier
- Create `.env.example` files with required API keys
- Docker Compose for local PostgreSQL

### 1.2 Database Schema

Create PostgreSQL tables:

- `users` (id, email, password_hash, created_at)
- `brokerage_connections` (id, user_id, provider, access_token_encrypted, refresh_token_encrypted, connected_at)
- `portfolio_holdings` (id, user_id, symbol, quantity, avg_cost, current_price, last_synced)
- `chat_sessions` (id, user_id, created_at)
- `chat_messages` (id, session_id, role, content, citations_json, created_at)

### 1.3 Core Dependencies

**Backend**:

- `@nestjs/core`, `@nestjs/config`, `@nestjs/typeorm`
- `@anthropic-ai/sdk` for Claude
- `axios` for external APIs
- `bcrypt`, `@nestjs/jwt`, `@nestjs/passport` for auth
- `typeorm`, `pg` for PostgreSQL

**Frontend**:

- `next`, `react`, `react-dom`
- `@tanstack/react-query` for data fetching
- `tailwindcss` for styling
- `axios` for API calls
- `@assistant-ui/react` for AI chat interface
- Initialize with `npx assistant-ui init`

## Phase 2: Backend Core (NestJS)

### 2.1 Authentication Module

- JWT-based authentication
- Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- AuthGuard for protected routes
- Password hashing with bcrypt

### 2.2 Brokerage Integration Module

**Alpaca Integration** (`/modules/brokerages/alpaca`):

- OAuth2 flow for connection
- API wrapper using Alpaca REST API
- Methods: `getAccount()`, `getPositions()`, `getPortfolioHistory()`

**Interactive Brokers Integration** (`/modules/brokerages/ibkr`):

- Client Portal API integration
- Session management (tickle endpoint)
- Methods: `getAccounts()`, `getPositions()`, `getMarketData()`

**Endpoints**:

- `POST /brokerages/connect` - Initiate OAuth/connection
- `GET /brokerages/callback` - Handle OAuth callback
- `GET /brokerages/positions` - Get current holdings
- `POST /brokerages/sync` - Trigger portfolio sync

### 2.3 Portfolio Module

- Service to aggregate data from connected brokerages
- Cron job to sync portfolio every 15 minutes
- Calculate P&L, allocation percentages
- Endpoints:
  - `GET /portfolio/summary` - Overview stats
  - `GET /portfolio/holdings` - Detailed positions
  - `GET /portfolio/performance` - Historical performance

### 2.4 Financial Data Module

**Yahoo Finance Service**:

- Price quotes, historical data, company info
- Methods: `getQuote()`, `getHistoricalPrices()`, `getNews()`

**Finnhub Service**:

- Real-time quotes, company metrics, earnings
- Methods: `getQuote()`, `getCompanyProfile()`, `getEarnings()`

**SEC EDGAR Service**:

- Parse EDGAR RSS feed or use SEC API
- Fetch 10-K, 10-Q filings by CIK/ticker
- Methods: `searchFilings()`, `getFilingText()`, `extractSections()`

### 2.5 AI Chat Module

**Chat Service** (`/modules/chat/chat.service.ts`):

- Maintain conversation context
- Query portfolio data based on user question
- Retrieve relevant financial data (price movements, news, filings)
- Build context for Claude with structured data
- Use Claude API with function calling/tool use
- Generate citations linking to sources

**RAG Pipeline**:

1. Parse user query and extract tickers/intents
2. Fetch portfolio context from DB
3. Query financial APIs for relevant data
4. Search EDGAR filings if needed
5. Build prompt with structured context
6. Call Claude API with tools for data retrieval
7. Format response with inline citations

**Endpoints**:

- `POST /chat/sessions` - Create new chat session
- `GET /chat/sessions/:id/messages` - Get chat history
- `POST /chat/sessions/:id/messages` - Send message, get AI response

## Phase 3: Frontend (Next.js)

### 3.1 App Structure

- `/app` directory with App Router
- `/app/auth` - Login/register pages
- `/app/dashboard` - Main portfolio view
- `/app/chat` - Chat interface
- `/app/connect` - Brokerage connection flow

### 3.2 Authentication

- Login/register forms with validation
- JWT token storage (httpOnly cookies)
- Protected route wrapper
- Auth context provider

### 3.3 Brokerage Connection Flow

- Connection page listing Alpaca + Interactive Brokers
- OAuth popup/redirect handling
- Connection status indicators
- Disconnect functionality

### 3.4 Portfolio Dashboard

- Summary cards: total value, day P&L, total return
- Holdings table: symbol, qty, price, value, P&L
- Allocation pie chart
- Performance line chart
- Auto-refresh data every 30s

### 3.5 Chat Interface

- Chat UI with message bubbles
- User input with auto-resize textarea
- Loading states during AI response
- Citation badges/links in AI messages
- Session history sidebar
- Suggested prompts: "Portfolio overview?", "Top performers this week?"

### 3.6 State Management

- React Query for server state
- Context API for auth state
- Optimistic updates for chat messages

## Phase 4: Integration & AI Logic

### 4.1 Claude Integration Strategy

Use **Prompt Engineering** with structured context:

```typescript
// Example prompt structure
const systemPrompt = `You are Jaspers AI, a financial advisor assistant.
You have access to the user's portfolio and financial data.
Always cite sources using [Source: <name>] format.`;

const userContext = {
  portfolio: holdings,
  query: userMessage,
  relevantData: {
    priceData: [...],
    news: [...],
    filings: [...]
  }
};
```

**Tool Use** (Claude's function calling):

- Define tools: `get_stock_price`, `get_company_news`, `search_edgar_filings`
- Claude decides when to call tools
- Execute tool calls server-side
- Return results to Claude for final answer

### 4.2 Citation System

- Track all data sources used in response
- Format: `[Source: SEC 10-K Q2 2024](link)`
- Store citations in `chat_messages.citations_json`
- Render as clickable badges in UI

### 4.3 Query Enhancement

- Extract tickers from natural language using regex/Claude
- Map portfolio nicknames to actual holdings
- Disambiguate: "Tesla" → TSLA, "my EV stock" → TSLA
- Determine time ranges: "this week" → last 7 days

## Phase 5: Security & Polish

### 5.1 Security

- Encrypt brokerage tokens at rest (AES-256)
- HTTPS only in production
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure OAuth state parameter

### 5.2 Error Handling

- Graceful failures for API timeouts
- User-friendly error messages
- Retry logic for brokerage API calls
- Logging with structured output

### 5.3 Performance

- Cache financial data (Redis optional)
- Debounce chat input
- Streaming responses from Claude (SSE)
- Lazy load historical data

## Phase 6: Deployment

### 6.1 Environment Setup

- Production PostgreSQL (AWS RDS, Supabase, or Railway)
- Backend deployment (Render, Railway, or AWS)
- Frontend deployment (Vercel)
- Environment variables for all API keys

### 6.2 CI/CD

- GitHub Actions for tests and linting
- Automated deployments on merge to main
- Database migrations strategy

## Key Files to Create

**Backend**:

- `/backend/src/modules/auth/*`
- `/backend/src/modules/brokerages/alpaca.service.ts`
- `/backend/src/modules/brokerages/ibkr.service.ts`
- `/backend/src/modules/portfolio/portfolio.service.ts`
- `/backend/src/modules/financial-data/yahoo-finance.service.ts`
- `/backend/src/modules/financial-data/finnhub.service.ts`
- `/backend/src/modules/financial-data/edgar.service.ts`
- `/backend/src/modules/chat/chat.service.ts`
- `/backend/src/modules/chat/chat.controller.ts`

**Frontend**:

- `/frontend/app/auth/login/page.tsx`
- `/frontend/app/dashboard/page.tsx`
- `/frontend/app/chat/page.tsx`
- `/frontend/components/PortfolioSummary.tsx`
- `/frontend/components/HoldingsTable.tsx`
- `/frontend/components/ChatInterface.tsx`
- `/frontend/lib/api-client.ts`

## Success Metrics for MVP

- Users can connect Alpaca OR Interactive Brokers
- Portfolio syncs within 1 minute of connection
- Chat responds in <5 seconds
- AI answers include at least 1 citation per response
- Mobile-responsive UI

### To-dos

- [ ] Initialize monorepo, Docker, database schema, and install core dependencies
- [ ] Build NestJS authentication module with JWT, register/login endpoints
- [ ] Implement Alpaca OAuth flow and API wrapper for portfolio data
- [ ] Implement Interactive Brokers Client Portal API integration
- [ ] Build portfolio aggregation service and sync cron job
- [ ] Create services for Yahoo Finance, Finnhub, and SEC EDGAR data retrieval
- [ ] Build chat module with Claude integration, RAG pipeline, and citation system
- [ ] Create Next.js auth pages, protected routes, and auth context
- [ ] Build brokerage connection flow UI and OAuth handling
- [ ] Create portfolio dashboard with summary, holdings table, and charts
- [ ] Build chat interface with message history, citations, and real-time updates
- [ ] Add encryption, rate limiting, error handling, and performance optimizations
- [ ] Set up production environment, deploy backend and frontend, configure CI/CD

