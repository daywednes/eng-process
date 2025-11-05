# Jaspers AI Backend - Setup Guide

## Quick Start

Follow these steps to get the backend API running on your local machine.

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start PostgreSQL Database

Using Docker Compose (recommended):

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379 (for future caching)

To check if PostgreSQL is running:

```bash
docker ps
```

### 3. Run Database Migrations

```bash
npm run migration:run
```

This will create all the necessary tables in the database.

### 4. Start the Development Server

```bash
npm run start:dev
```

The API will be available at: **http://localhost:3000**

## Testing the Authentication APIs

Once the server is running, you can test the authentication endpoints:

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": false,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### 3. Get Current User Profile

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Update Profile

```bash
curl -X PATCH http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### 5. Change Password

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test123456",
    "newPassword": "NewTest123456"
  }'
```

### 6. Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 7. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

Note: Check the console logs for the password reset token (email functionality not implemented yet).

### 9. Reset Password

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_CONSOLE",
    "newPassword": "NewPassword123"
  }'
```

### 10. Verify Email

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "VERIFICATION_TOKEN"
  }'
```

## Available Endpoints

All authentication endpoints are now implemented:

- ✅ `POST /api/auth/register` - Create new user account
- ✅ `POST /api/auth/login` - Authenticate user, return JWT
- ✅ `POST /api/auth/refresh` - Refresh access token using refresh token
- ✅ `POST /api/auth/logout` - Invalidate session
- ✅ `POST /api/auth/verify-email` - Confirm email verification
- ✅ `POST /api/auth/forgot-password` - Request password reset
- ✅ `POST /api/auth/reset-password` - Reset password with token
- ✅ `GET /api/auth/me` - Get current user profile
- ✅ `PATCH /api/auth/me` - Update user profile (name, email)
- ✅ `POST /api/auth/change-password` - Change password (requires current password)

## Database Management

### View Database Tables

Connect to PostgreSQL:

```bash
docker exec -it jaspers_postgres psql -U postgres -d jaspers_ai
```

Then run SQL commands:

```sql
-- List all tables
\dt

-- View users
SELECT * FROM users;

-- View audit logs
SELECT * FROM audit_logs;

-- Exit
\q
```

### Reset Database

If you need to reset the database:

```bash
# Revert all migrations
npm run migration:revert

# Run migrations again
npm run migration:run
```

### Stop Database

```bash
docker-compose down
```

To remove all data:

```bash
docker-compose down -v
```

## Development Commands

```bash
# Start in development mode (with hot reload)
npm run start:dev

# Start in debug mode
npm run start:debug

# Build for production
npm run build

# Start production build
npm run start:prod

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── config/                    # Configuration files
│   ├── common/                    # Shared utilities, guards, interceptors
│   ├── entities/                  # TypeORM entities
│   ├── modules/
│   │   └── auth/                  # Authentication module
│   └── migrations/                # Database migrations
├── docker-compose.yml             # Docker setup
├── package.json                   # Dependencies
└── .env                           # Environment variables
```

## Environment Variables

Make sure your `.env` file is configured correctly:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=jaspers_ai

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345678
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-change-this-in-production-87654321
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change the `PORT` in `.env`:

```env
PORT=3001
```

### Database Connection Error

Make sure PostgreSQL is running:

```bash
docker ps
```

If not running:

```bash
docker-compose up -d
```

### Migration Errors

If you encounter migration errors, try resetting the database:

```bash
npm run migration:revert
npm run migration:run
```

## Next Steps

Now that the authentication system is working, you can:

1. Test all the authentication endpoints
2. Implement additional modules (portfolio, chat, etc.)
3. Add integration tests
4. Set up CI/CD pipeline
5. Deploy to production

## Security Notes

⚠️ **Important for Production:**

1. Change all JWT secrets to strong, random values
2. Use a proper encryption key (64 hex characters)
3. Enable HTTPS
4. Configure CORS properly (don't use `*`)
5. Set up rate limiting
6. Implement email service for verification and password reset
7. Add monitoring and logging
8. Use environment-specific configuration files

