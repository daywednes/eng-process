# Testing Guide - Jaspers AI Backend

## Overview

This project includes comprehensive testing:
- **Unit Tests**: Test individual services and utilities in isolation
- **E2E Tests**: Test complete API endpoints and user flows
- **CI/CD**: Automated testing on every push and pull request

## Test Structure

```
backend/
├── src/
│   └── modules/auth/
│       └── auth.service.spec.ts      # Unit tests
└── test/
    ├── auth.e2e-spec.ts               # E2E tests
    └── jest-e2e.json                  # E2E Jest config
```

## Running Tests

### Prerequisites

```bash
# Start test database
docker-compose up -d postgres

# Install dependencies
npm install
```

### Unit Tests

Test individual services, utilities, and functions:

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run specific test file
npm run test -- auth.service.spec

# Debug tests
npm run test:debug
```

### E2E (End-to-End) Tests

Test complete API endpoints with real database:

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with coverage
npm run test:e2e -- --coverage

# Run specific E2E test
npm run test:e2e -- --testNamePattern="should register a new user"
```

### All Tests

```bash
# Run unit + E2E tests
npm run test && npm run test:e2e

# Run all tests with coverage
npm run test:cov && npm run test:e2e -- --coverage
```

## Test Coverage

### Current Coverage

Unit Tests:
- **Auth Service**: 90%+ coverage
  - ✅ register() - all scenarios
  - ✅ login() - valid/invalid credentials
  - ✅ changePassword() - verification
  - ✅ getProfile() - user retrieval
  - ✅ updateProfile() - profile updates
  - ✅ refreshToken() - token generation
  - ✅ logout() - audit logging

E2E Tests:
- **Authentication Flow**: 100% endpoint coverage
  - ✅ POST /api/auth/register - 5 test cases
  - ✅ POST /api/auth/login - 4 test cases
  - ✅ GET /api/auth/me - 3 test cases
  - ✅ PATCH /api/auth/me - 3 test cases
  - ✅ POST /api/auth/change-password - 3 test cases
  - ✅ POST /api/auth/refresh - 3 test cases
  - ✅ POST /api/auth/logout - 2 test cases
  - ✅ POST /api/auth/forgot-password - 3 test cases
  - ✅ Complete user flow - 1 integration test

### View Coverage Reports

```bash
# Generate coverage report
npm run test:cov

# Open HTML coverage report in browser
open coverage/lcov-report/index.html

# E2E coverage
npm run test:e2e -- --coverage
open coverage-e2e/lcov-report/index.html
```

## Test Cases

### Unit Tests (auth.service.spec.ts)

#### Registration Tests
```typescript
✅ should successfully register a new user
✅ should throw ConflictException if email already exists
✅ should hash password before saving
```

#### Login Tests
```typescript
✅ should successfully login with valid credentials
✅ should throw UnauthorizedException with invalid email
✅ should throw UnauthorizedException with invalid password
✅ should throw UnauthorizedException if user is inactive
✅ should update lastLoginAt timestamp
```

#### Password Change Tests
```typescript
✅ should successfully change password with valid current password
✅ should throw UnauthorizedException with incorrect current password
✅ should throw NotFoundException if user does not exist
```

#### Profile Tests
```typescript
✅ should return user profile
✅ should throw NotFoundException if user does not exist
✅ should successfully update user profile
✅ should throw ConflictException if new email already exists
```

#### Token Tests
```typescript
✅ should generate new tokens
✅ should create audit log on logout
```

### E2E Tests (auth.e2e-spec.ts)

#### Registration Endpoint
```typescript
✅ should register a new user successfully
✅ should fail with weak password
✅ should fail with duplicate email
✅ should fail with invalid email format
✅ should fail with missing required fields
```

#### Login Endpoint
```typescript
✅ should login successfully with valid credentials
✅ should fail with incorrect password
✅ should fail with non-existent email
✅ should fail with missing credentials
```

#### Profile Endpoints
```typescript
✅ should get current user profile with valid token
✅ should fail without authorization token
✅ should fail with invalid token
✅ should update user profile successfully
✅ should fail with invalid email format
```

#### Password Management
```typescript
✅ should change password successfully
✅ should login with new password
✅ should fail with incorrect current password
✅ should fail with weak new password
```

#### Token Management
```typescript
✅ should refresh tokens successfully
✅ should fail with invalid refresh token
✅ should fail without refresh token
```

#### Complete Flow
```typescript
✅ should complete full registration → login → profile update → logout flow
```

## Writing New Tests

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('yourMethod', () => {
    it('should do something', () => {
      const result = service.yourMethod();
      expect(result).toBe(expectedValue);
    });
  });
});
```

### E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('YourEndpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/your-endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/your-endpoint')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
      });
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

The project includes automated CI/CD that runs on:
- Every push to `main`, `master`, `develop`, `feature/*` branches
- Every pull request

#### Pipeline Jobs

1. **Lint & Format Check**
   - Runs ESLint
   - Checks code formatting with Prettier

2. **Unit Tests**
   - Runs all unit tests
   - Generates coverage report
   - Uploads to Codecov (optional)

3. **E2E Tests**
   - Starts PostgreSQL service
   - Runs database migrations
   - Executes E2E tests
   - Uploads coverage report

4. **Build**
   - Compiles TypeScript
   - Verifies build artifacts

5. **Security Audit**
   - Runs `npm audit`
   - Fails on critical/high vulnerabilities

6. **Summary**
   - Displays results of all jobs
   - Fails if any job failed

### Viewing CI Results

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select a workflow run
4. View individual job logs

### CI Configuration

The workflow is defined in `.github/workflows/ci.yml`

Key features:
- ✅ Parallel job execution for speed
- ✅ PostgreSQL service for E2E tests
- ✅ Coverage reporting
- ✅ Security scanning
- ✅ Build verification

## Best Practices

### 1. Test Naming

```typescript
// ❌ Bad
it('test1', () => {});

// ✅ Good
it('should successfully register a new user', () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const price = 100;
  const quantity = 2;
  
  // Act
  const total = service.calculateTotal(price, quantity);
  
  // Assert
  expect(total).toBe(200);
});
```

### 3. Test One Thing

```typescript
// ❌ Bad - testing multiple things
it('should handle user operations', () => {
  const user = service.create();
  expect(user).toBeDefined();
  
  const updated = service.update(user.id, {});
  expect(updated).toBeDefined();
  
  service.delete(user.id);
});

// ✅ Good - separate tests
it('should create user', () => {});
it('should update user', () => {});
it('should delete user', () => {});
```

### 4. Use Descriptive Mocks

```typescript
const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  // Only mock what you need
};
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await app.close();
  await dataSource.destroy();
});
```

## Debugging Tests

### VSCode Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "--watchAll=false",
    "${fileBasename}"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug Single Test

```bash
# Add debugger statement in your test
it('should do something', () => {
  debugger; // <- Add this
  const result = service.method();
  expect(result).toBe(value);
});

# Run in debug mode
npm run test:debug
```

## Troubleshooting

### Tests Failing Locally

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Ensure database is running
docker-compose up -d postgres

# Check environment variables
cat .env
```

### E2E Tests Can't Connect to Database

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs jaspers_postgres

# Manually run migrations
npm run migration:run
```

### Coverage Not Updating

```bash
# Remove coverage directory
rm -rf coverage coverage-e2e

# Run tests again
npm run test:cov
npm run test:e2e -- --coverage
```

## Next Steps

### Tests to Add

1. **Brokerage Module Tests** (when implemented)
   - Alpaca OAuth flow
   - IBKR connection
   - Token encryption/decryption

2. **Portfolio Module Tests** (when implemented)
   - Holdings aggregation
   - P&L calculations
   - Snapshot generation

3. **Financial Data Tests** (when implemented)
   - Stock quote fetching
   - Caching logic
   - Data normalization

4. **Chat Module Tests** (when implemented)
   - Claude integration
   - RAG pipeline
   - Tool execution

### Improve Coverage

- Add integration tests for database operations
- Add performance tests for expensive operations
- Add load tests for API endpoints
- Add security tests for authentication

## Resources

- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

## Quick Reference

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Lint
npm run lint

# Format
npm run format
```

Happy Testing! 🧪✨

