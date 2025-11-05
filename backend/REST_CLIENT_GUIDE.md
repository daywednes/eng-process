# How to Test APIs with REST Client in VS Code/Cursor

## Step 1: Install REST Client Extension

### In VS Code or Cursor:
1. Open Extensions (Cmd+Shift+X on Mac, Ctrl+Shift+X on Windows)
2. Search for "REST Client" by Huachao Mao
3. Click Install
4. Restart VS Code/Cursor if needed

## Step 2: Open the Test File

1. Open the file: `backend/api-tests.http`
2. You'll see all the API tests with syntax highlighting

## Step 3: Start Your Server

Make sure your server is running:
```bash
cd backend
npm run start:dev
```

You should see: `🚀 Application is running on: http://localhost:3000`

## Step 4: Send Your First Request

### Method 1: Click "Send Request"
- You'll see a clickable "Send Request" link above each HTTP request
- Click it to execute the request
- Response appears in a new panel on the right

### Method 2: Keyboard Shortcut
- Place cursor anywhere in the request block
- Press `Cmd+Alt+R` (Mac) or `Ctrl+Alt+R` (Windows)

## Step 5: Test the Complete Flow

### 1. Register a New User

Find this request in the file:
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Click "Send Request" above it.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### 2. Copy the Access Token

From the response, copy the `accessToken` value.

Go to the top of the `api-tests.http` file and paste it:
```http
@accessToken = eyJhbGc... [PASTE YOUR TOKEN HERE]
```

### 3. Test Authenticated Endpoint

Now try getting your profile:
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{accessToken}}
```

Click "Send Request" - it should return your user profile!

### 4. Test Other Endpoints

Continue testing other endpoints in order:
- ✅ Update Profile
- ✅ Change Password
- ✅ Logout
- ✅ Login again
- ✅ Forgot Password
- ✅ etc.

## Visual Guide

### What You'll See:

```
┌─────────────────────────────────────────────────┐
│  api-tests.http                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ### 1. REGISTER                                │
│  POST http://localhost:3000/api/auth/register  │
│  Content-Type: application/json                 │
│  👆 Send Request (click this)                   │
│                                                 │
│  {                                              │
│    "email": "test@example.com",                 │
│    "password": "Test123456"                     │
│  }                                              │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓
        (Click "Send Request")
                    ↓
┌─────────────────────────────────────────────────┐
│  Response (New Panel)                           │
├─────────────────────────────────────────────────┤
│  HTTP/1.1 201 Created                           │
│  Content-Type: application/json                 │
│                                                 │
│  {                                              │
│    "success": true,                             │
│    "data": {                                    │
│      "user": { ... },                           │
│      "tokens": {                                │
│        "accessToken": "eyJ...",  ← Copy this    │
│        "refreshToken": "eyJ..."                 │
│      }                                          │
│    }                                            │
│  }                                              │
└─────────────────────────────────────────────────┘
```

## Tips & Tricks

### 1. Use Variables
At the top of the file, you can define variables:
```http
@baseUrl = http://localhost:3000
@accessToken = your-token-here
```

Then use them in requests:
```http
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{accessToken}}
```

### 2. Keyboard Shortcuts
- **Send Request**: `Cmd+Alt+R` (Mac) / `Ctrl+Alt+R` (Windows)
- **Cancel Request**: `Cmd+Alt+K` (Mac) / `Ctrl+Alt+K` (Windows)
- **Re-run Last Request**: `Cmd+Alt+L` (Mac) / `Ctrl+Alt+L` (Windows)

### 3. View Response Headers
Click the "Response Headers" tab in the response panel

### 4. Save Response to File
Right-click in response panel → "Save Response Body"

### 5. Copy Response
Right-click in response panel → "Copy Response Body"

## Common Issues & Solutions

### ❌ "Connection Refused"
**Problem**: Server is not running  
**Solution**: 
```bash
cd backend
npm run start:dev
```

### ❌ "401 Unauthorized"
**Problem**: Token expired or missing  
**Solution**: 
1. Login again to get a new token
2. Copy the new `accessToken`
3. Update the `@accessToken` variable at the top

### ❌ "404 Not Found"
**Problem**: Wrong URL or endpoint  
**Solution**: Check that the endpoint starts with `/api/auth/...`

### ❌ "500 Internal Server Error"
**Problem**: Server error  
**Solution**: Check the server console logs for error details

## Testing Complete Flow Example

Here's a complete test sequence:

```http
### 1. Register
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123456",
  "firstName": "Test",
  "lastName": "User"
}
# ✅ Copy the accessToken from response

### 2. Get Profile (paste token above first!)
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{accessToken}}
# ✅ Should return your user info

### 3. Update Profile
PATCH {{baseUrl}}/api/auth/me
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
# ✅ Should return updated user

### 4. Change Password
POST {{baseUrl}}/api/auth/change-password
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "currentPassword": "Test123456",
  "newPassword": "NewPassword123"
}
# ✅ Should return success message

### 5. Logout
POST {{baseUrl}}/api/auth/logout
Authorization: Bearer {{accessToken}}
# ✅ Should return success message
```

## Debugging Tips

### View Request Details
In the response panel, you'll see:
- Status code (200, 201, 401, etc.)
- Response time
- Response size
- Full response body

### Check Server Logs
Watch the terminal where your server is running for:
- Request logs
- Error messages
- Database queries
- Password reset tokens
- Email verification tokens

### Test Error Cases
Try intentionally wrong inputs to test validation:
```http
### Test: Weak Password
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "weak"
}
# ❌ Should fail with validation error
```

## Next Steps

After testing all endpoints successfully:

1. ✅ Verify user data in database
2. ✅ Check audit logs
3. ✅ Test error scenarios
4. ✅ Try different user accounts
5. ✅ Test token expiration

## Need Help?

- Check server logs in terminal
- Check `SETUP.md` for detailed API documentation
- Check `IMPLEMENTATION_SUMMARY.md` for architecture details

Happy Testing! 🚀

