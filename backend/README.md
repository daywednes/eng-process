# Jaspers AI - Backend

Personalized Investment Copilot Backend API built with NestJS

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Database

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
npm run migration:run
```

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## Available Scripts

- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start in production mode
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run migration:generate` - Generate migration from entities
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── config/                 # Configuration files
├── common/                 # Shared utilities, guards, interceptors
├── entities/               # TypeORM entities
└── modules/                # Feature modules
    ├── auth/               # Authentication
    ├── users/              # User management
    ├── brokerages/         # Brokerage integration
    ├── portfolio/          # Portfolio management
    ├── financial-data/     # Financial data APIs
    ├── chat/               # Chat & AI
    └── analytics/          # Analytics & monitoring
```

## API Documentation

See the [API Documentation](../apis.md) for detailed endpoint information.

## Technologies

- **Framework:** NestJS
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport
- **Validation:** class-validator
- **Caching:** Redis (optional)

## License

MIT

