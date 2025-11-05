# Complete API Architecture for Jaspers AI

## 1. Authentication & User Management APIs

**Business Logic:** Secure user onboarding, session management, and profile control

### Endpoints:
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user, return JWT
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `POST /api/auth/logout` - Invalidate session
- `POST /api/auth/verify-email` - Confirm email verification
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update user profile (name, email)
- `POST /api/auth/change-password` - Change password (requires current password)

### Key Business Logic:
- JWT-based authentication with refresh tokens (15min access, 7-day refresh)
- Password hashing with bcrypt (10 rounds minimum)
- Email verification flow with expiring tokens
- Rate limiting on login attempts (5 attempts per 15 min to prevent brute force)
- Audit logging for all auth events (login, logout, password changes)
- Session invalidation on password change
- Secure password requirements (min 8 chars, uppercase, lowercase, number)

---

## 2. User Settings APIs

**Business Logic:** Manage user preferences and notification settings

### Endpoints:
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings (currency, timezone, notifications)

### Key Business Logic:
- Default settings created on user registration
- Support for timezone-aware operations
- Notification preferences for email alerts
- Currency preference for portfolio display

---

## 3. Brokerage Connection APIs

**Business Logic:** OAuth integration, secure credential storage, connection health monitoring

### Endpoints:
- `GET /api/brokerages` - List all available brokerage providers
- `GET /api/brokerages/connections` - Get user's connected brokerages
- `POST /api/brokerages/connect` - Initiate OAuth/connection flow
- `GET /api/brokerages/callback` - Handle OAuth callback (Alpaca)
- `POST /api/brokerages/ibkr/connect` - IBKR-specific connection (session-based)
- `DELETE /api/brokerages/connections/:id` - Disconnect brokerage
- `POST /api/brokerages/connections/:id/sync` - Manually trigger sync
- `GET /api/brokerages/connections/:id/status` - Check connection health

### Key Business Logic:
- **Alpaca:** OAuth 2.0 flow with PKCE
- **IBKR:** Session-based authentication with Client Portal Gateway
- AES-256 encryption for access/refresh tokens at rest
- Token refresh logic executed automatically before expiration
- Connection health checks every 5 minutes (detect invalid/expired tokens)
- Graceful error handling for API failures with retry logic
- Store external account IDs for reconciliation
- Track sync status (`pending`, `syncing`, `success`, `error`)
- Audit logging for connect/disconnect events

---

## 4. Portfolio APIs

**Business Logic:** Aggregate multi-brokerage data, calculate metrics, track performance

### Endpoints:
- `GET /api/portfolio/summary` - Total value, P&L, cash balance
- `GET /api/portfolio/holdings` - Detailed list of all positions
- `GET /api/portfolio/holdings/:symbol` - Details for specific holding
- `GET /api/portfolio/performance` - Historical performance data
- `GET /api/portfolio/snapshots` - Daily snapshots for charting
- `GET /api/portfolio/allocation` - Asset allocation breakdown
- `POST /api/portfolio/sync` - Force sync all connected brokerages

### Key Business Logic:
- **Aggregate holdings** across multiple brokerage accounts
- **Deduplication:** Combine same symbol across different brokers
- **Calculate metrics:**
  - Unrealized P&L: `(current_price - average_cost) * quantity`
  - P&L %: `(unrealized_pl / cost_basis) * 100`
  - Allocation %: `(holding_value / total_portfolio_value) * 100`
  - Market value: `quantity * current_price`
  - Cost basis: `quantity * average_cost`
- **Auto-sync:** Cron job every 15 minutes during market hours
- **Cache strategy:** 30-second TTL for summary data, 1-minute for holdings
- **Handle partial failures:** If one brokerage fails, still return others
- **Daily snapshots:** Create snapshot at market close (4 PM ET) for historical tracking
- **Cost basis accounting:** Use average cost method (can extend to FIFO/LIFO later)

---

## 5. Financial Data APIs

**Business Logic:** Multi-source data aggregation with smart caching and fallback

### Stock Quotes:
- `GET /api/stocks/quote/:symbol` - Real-time quote for single stock
- `POST /api/stocks/quotes` - Batch quotes (multiple symbols)
- `GET /api/stocks/:symbol/history` - Historical price data (OHLCV)

### Company Information:
- `GET /api/stocks/:symbol/info` - Company profile, sector, industry
- `GET /api/stocks/:symbol/metrics` - Key metrics (P/E, market cap, etc.)
- `GET /api/stocks/:symbol/earnings` - Earnings data and calendar

### News:
- `GET /api/stocks/:symbol/news` - Latest news for symbol
- `GET /api/news` - General market news

### SEC Filings:
- `GET /api/edgar/filings/:symbol` - List filings by ticker
- `GET /api/edgar/filings/:cik` - List filings by CIK
- `GET /api/edgar/filing/:accession` - Get specific filing content
- `GET /api/edgar/search` - Search filings by criteria

### Key Business Logic:
- **Data Source Priority:** 
  - Quotes: Yahoo Finance (primary) → Finnhub (fallback)
  - Company info: Finnhub (primary) → Yahoo Finance (fallback)
  - News: Finnhub (primary) → Yahoo Finance (secondary)
  - Filings: SEC EDGAR only
- **Caching Strategy:**
  - Quotes: 1-minute TTL during market hours (9:30 AM - 4 PM ET), 1-hour after hours
  - Company info: 24-hour TTL (rarely changes)
  - News: 15-minute TTL
  - EDGAR filings: Cache indefinitely (immutable once published)
- **Rate Limiting:** Track API usage per provider to stay within quotas
  - Yahoo Finance: Unlimited (unofficial API)
  - Finnhub: 60 calls/minute (free tier)
  - SEC EDGAR: 10 requests/second max
- **Data Normalization:** Standardize response format across providers
- **Cost Tracking:** Log all API calls to `api_usage_logs` for monitoring
- **Error Handling:** Return cached data if live fetch fails (stale data > no data)

---

## 6. Chat & AI APIs

**Business Logic:** Conversational AI with RAG pipeline, tool calling, citation tracking, and streaming

### Endpoints:
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions` - List user's chat sessions
- `GET /api/chat/sessions/:id` - Get session details
- `PATCH /api/chat/sessions/:id` - Update session (title, archive)
- `DELETE /api/chat/sessions/:id` - Delete session
- `GET /api/chat/sessions/:id/messages` - Get message history
- `POST /api/chat/sessions/:id/messages` - Send message, get AI response
- `GET /api/chat/sessions/:id/messages/stream` - SSE endpoint for streaming

### Key Business Logic:

#### RAG Pipeline:
1. **Intent Detection:** Parse user query to extract:
   - Ticker symbols (AAPL, TSLA, "my tech stocks")
   - Time ranges ("this week", "last quarter", "YTD")
   - Question type (portfolio analysis, market data, company research)

2. **Context Retrieval:**
   - Fetch user's portfolio holdings from DB
   - Get relevant stock quotes for mentioned symbols
   - Search recent news if market sentiment is relevant
   - Retrieve EDGAR filings for fundamental analysis questions

3. **Context Building:**
   - Structure portfolio data as JSON for Claude
   - Include only relevant holdings (filter by symbols mentioned)
   - Add market context (current prices, P&L)
   - Attach news summaries or filing excerpts

#### Claude Tool Calling:
- **Define tools:**
  - `get_portfolio_holdings` - Retrieve user's positions
  - `get_stock_quote` - Get current price and metrics
  - `search_company_news` - Find recent news articles
  - `search_edgar_filings` - Search SEC filings
  - `get_portfolio_performance` - Historical performance data
  - `calculate_portfolio_metrics` - Custom calculations

- **Tool execution flow:**
  1. Claude receives user message + system prompt + available tools
  2. Claude decides which tools to call based on query
  3. Backend executes tool calls server-side
  4. Results returned to Claude with structured data
  5. Claude synthesizes final answer incorporating tool results

#### Citation Generation:
- **Track all data sources** used in response
- **Format examples:**
  - `[Source: Yahoo Finance - AAPL Quote, 2024-10-27](url)`
  - `[Source: SEC 10-K Filing, Q4 2023](url)`
  - `[Source: Portfolio Holdings](internal)`
- **Store in `chat_messages.citations`** JSON field
- **Render as clickable badges** in UI
- **Include timestamps** for data freshness

#### Streaming (SSE):
- Use Server-Sent Events for real-time response streaming
- Stream Claude response chunks as they arrive
- Better UX for long responses (user sees progress)
- Handle tool calls mid-stream (show "thinking" indicators)

#### Additional Logic:
- **Conversation memory:** Include last 10 messages for context
- **Token management:** Track usage per message, estimate costs
- **Model selection:** Use `claude-3-5-sonnet-20241022` for MVP
- **Processing time tracking:** Log `processing_time_ms` for monitoring
- **Error graceful degradation:** If tool fails, Claude can still respond with partial data
- **Auto-generate titles:** Use first user message or Claude summary

---

## 7. Analytics & Monitoring APIs

**Business Logic:** Usage tracking, cost management, security auditing, health monitoring

### Endpoints:
- `GET /api/analytics/usage` - API usage stats per provider
- `GET /api/analytics/costs` - Estimated costs (Claude tokens, API calls)
- `GET /api/audit/logs` - Security audit trail (admin only)
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - Prometheus metrics (optional)

### Key Business Logic:
- **Track API costs per user** for future billing/quota enforcement
- **Monitor Claude token usage:**
  - Input tokens: ~$3 per 1M tokens
  - Output tokens: ~$15 per 1M tokens
  - Cache read/write optimization
- **Audit trail** captures:
  - Authentication events (login, logout, failed attempts)
  - Brokerage connections/disconnections
  - Portfolio sync operations
  - Chat session creation
  - Settings changes
  - Password changes
- **Track IP addresses and user agents** for security
- **Detect anomalous patterns:**
  - Excessive API calls (potential abuse)
  - Failed login attempts (brute force)
  - Unusual chat volume (bot activity)
- **Health checks:**
  - Database connectivity
  - External API availability (Alpaca, IBKR, Yahoo, Finnhub, EDGAR)
  - Claude API status

---

## 8. Admin APIs (Future Enhancement)

**Business Logic:** Platform management and user support

### Endpoints:
- `GET /api/admin/users` - List all users with stats
- `PATCH /api/admin/users/:id` - Update user (admin)
- `POST /api/admin/users/:id/disable` - Disable user account
- `GET /api/admin/stats` - Platform-wide statistics
- `GET /api/admin/api-costs` - Total API costs breakdown

### Key Business Logic:
- Role-based access control (RBAC)
- User impersonation for support
- Platform-wide cost tracking
- User activity monitoring

---

## API Design Principles

### RESTful Conventions:
- Use proper HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`)
- Plural nouns for collections (`/api/holdings`)
- Use query params for filtering, sorting, pagination
- Consistent response format:
```typescript
{
  success: boolean,
  data: any,
  error?: { code: string, message: string },
  meta?: { page, limit, total }
}
```

### Authentication:
- All endpoints (except `/auth/*` and `/health`) require JWT bearer token
- Use `Authorization: Bearer <token>` header
- Return `401 Unauthorized` for invalid/expired tokens
- Return `403 Forbidden` for insufficient permissions

### Error Handling:
- Use standard HTTP status codes
- Return structured error responses:
```typescript
{
  success: false,
  error: {
    code: "PORTFOLIO_SYNC_FAILED",
    message: "Unable to sync portfolio from Alpaca",
    details?: any
  }
}
```

### Pagination:
- Query params: `?page=1&limit=20&sort=-created_at`
- Response meta: `{ page, limit, total, hasMore }`
- Default limit: 20, max limit: 100

### Rate Limiting:
- **Global:** 1000 requests/hour per user
- **Auth login:** 5 attempts per 15 minutes per IP
- **Chat messages:** 10 messages/minute per session
- **Portfolio sync:** 4 syncs/hour per user
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Priority for MVP Implementation

### Phase 1 - Core (Must Have):
1. Auth APIs (register, login, JWT, refresh)
2. Brokerage connection (Alpaca only for MVP)
3. Portfolio summary & holdings
4. Basic chat with Claude (no RAG yet, simple Q&A)
5. Stock quotes API (Yahoo Finance)

### Phase 2 - Enhancement:
1. Financial data APIs (company info, news)
2. RAG pipeline with tool calling
3. Citation system
4. Portfolio performance & snapshots
5. EDGAR filing search

### Phase 3 - Polish:
1. Streaming responses (SSE)
2. Advanced portfolio analytics
3. Admin APIs
4. IBKR integration
5. Real-time portfolio updates via WebSocket

---

## External APIs Required

### Authentication & LLM:
- **Anthropic Claude API** - AI chat interactions and natural language processing

### Brokerage Integrations:
- **Alpaca API** - OAuth2 flow, portfolio data, positions, account info
- **Interactive Brokers (IBKR) Client Portal API** - Session management, positions, market data

### Financial Data Providers:
- **Yahoo Finance API** - Stock quotes, historical prices, company info, news
- **Finnhub API** - Real-time quotes, company profiles, earnings, metrics
- **SEC EDGAR API** - SEC filings (10-K, 10-Q, 8-K), CIK lookups, filing documents

**Total External APIs: 6**

