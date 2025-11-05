# 🚀 Pre-Push Checklist

## Before Making a PR, Run This:

### Option 1: Complete Validation (Recommended) ✅

Run **ALL** checks that CI/CD will run:

```bash
cd backend
npm run pre-push
```

**What it does:**
- ✅ Lints your code (ESLint)
- ✅ Checks code formatting (Prettier)
- ✅ Runs unit tests (19 tests)
- ✅ Builds the application (TypeScript)
- ✅ Security audit (npm audit)

**Time:** ~30 seconds

**Output:**
```
🚀 Running pre-push checks...

📝 Running ESLint...
✅ Linting passed

🎨 Checking code formatting...
✅ Formatting passed

🧪 Running unit tests...
✅ Unit tests passed

🔨 Building application...
✅ Build passed

🔒 Running security audit...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All checks passed! Ready to push! 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Option 2: Quick Check (Fast Feedback) ⚡

For rapid iteration during development:

```bash
cd backend
npm run pre-push:quick
```

**What it does:**
- ✅ Lints your code
- ✅ Builds the application

**Time:** ~5 seconds

**Use when:**
- Making small changes
- Want quick feedback
- Need to iterate fast

---

### Option 3: Individual Commands 🎯

Run specific checks:

```bash
cd backend

# Check linting (without auto-fixing)
npm run lint:check

# Check formatting (without auto-fixing)
npm run format:check

# Run unit tests
npm run test

# Build application
npm run build

# Run all of the above
npm run validate
```

---

## Complete Pre-Push Workflow

### Step 1: Make Your Changes
```bash
# Write your code...
# Edit files...
```

### Step 2: Auto-Format Code (Optional)
```bash
npm run format
```

### Step 3: Run Pre-Push Checks
```bash
npm run pre-push
```

### Step 4: If All Pass, Commit & Push
```bash
git add .
git commit -m "your commit message"
git push
```

---

## What Each Check Does

### 1. Linting (ESLint)
**Purpose:** Find code quality issues, bugs, and style problems

**Checks:**
- Unused variables
- Undefined variables
- Code style violations
- Potential bugs
- TypeScript errors

**Fix issues:**
```bash
npm run lint  # Auto-fixes most issues
```

---

### 2. Formatting (Prettier)
**Purpose:** Ensure consistent code style

**Checks:**
- Indentation
- Quotes (single vs double)
- Semicolons
- Line length
- Trailing commas

**Fix issues:**
```bash
npm run format  # Auto-formats all files
```

---

### 3. Unit Tests
**Purpose:** Verify business logic works correctly

**Runs:**
- 19 test cases
- Auth service tests
- ~90% code coverage

**Debug failures:**
```bash
npm run test:watch  # Watch mode
npm run test:cov    # With coverage
```

---

### 4. Build
**Purpose:** Ensure TypeScript compiles without errors

**Checks:**
- Type errors
- Syntax errors
- Import errors
- Configuration errors

**View build output:**
```bash
npm run build
ls dist/  # Check compiled files
```

---

### 5. Security Audit
**Purpose:** Check for known vulnerabilities

**Checks:**
- Vulnerable dependencies
- Outdated packages
- Security advisories

**Fix vulnerabilities:**
```bash
npm audit fix           # Safe fixes
npm audit fix --force   # May have breaking changes
```

---

## Common Issues & Fixes

### ❌ Lint Errors

**Problem:** ESLint finds errors

**Solution:**
```bash
# Let ESLint auto-fix
npm run lint

# If that doesn't work, fix manually based on error messages
```

**Common errors:**
- Unused variables → Remove them
- Missing return types → Add type annotations
- Console.logs → Remove or use proper logging

---

### ❌ Format Errors

**Problem:** Code not properly formatted

**Solution:**
```bash
# Auto-format everything
npm run format
```

---

### ❌ Test Failures

**Problem:** Tests fail

**Solution:**
```bash
# Run tests in watch mode to see details
npm run test:watch

# Debug specific test
npm run test -- auth.service.spec

# Check test output for error details
```

---

### ❌ Build Errors

**Problem:** TypeScript compilation fails

**Solution:**
```bash
# Check the error message
npm run build

# Common issues:
# - Type errors → Add proper types
# - Import errors → Fix import paths
# - Missing files → Check file paths
```

---

### ❌ Security Vulnerabilities

**Problem:** npm audit finds issues

**Solution:**
```bash
# Try safe fixes first
npm audit fix

# If critical/high vulnerabilities:
npm audit fix --force

# Check what changed
git diff package.json
```

---

## Quick Reference Card

### Before EVERY push:
```bash
npm run pre-push
```

### During development:
```bash
npm run test:watch    # Watch tests
npm run start:dev     # Run server
```

### Before committing:
```bash
npm run format        # Format code
npm run lint          # Fix lint issues
npm run test          # Run tests
```

### Complete workflow:
```bash
# 1. Make changes
# 2. Format & fix
npm run format && npm run lint

# 3. Test
npm run test

# 4. Pre-push check
npm run pre-push

# 5. If all green, commit & push
git add .
git commit -m "your message"
git push
```

---

## CI/CD vs Local

### What CI/CD Runs (GitHub Actions)

1. ✅ Lint & Format Check
2. ✅ Unit Tests
3. ✅ **E2E Tests** (with PostgreSQL)
4. ✅ Build
5. ✅ Security Audit
6. ✅ Summary

### What You Should Run Locally

**Minimum:**
```bash
npm run pre-push  # Covers 1, 2, 4, 5
```

**Optional:**
- E2E tests run in CI (they're configured for CI environment)
- You can skip E2E locally since they need database setup

---

## Automation Options

### Option 1: Git Pre-Push Hook (Automatic)

Create `.git/hooks/pre-push`:
```bash
#!/bin/bash
cd backend && npm run pre-push
```

```bash
chmod +x .git/hooks/pre-push
```

Now checks run automatically before every push!

---

### Option 2: Alias for Quick Access

Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias prepush='cd backend && npm run pre-push'
alias prepushq='cd backend && npm run pre-push:quick'
```

Then just run:
```bash
prepush   # Full check
prepushq  # Quick check
```

---

## Success Criteria

Before pushing, ensure:

- [ ] ✅ `npm run lint` - No errors
- [ ] ✅ `npm run format:check` - All files formatted
- [ ] ✅ `npm run test` - All 19 tests pass
- [ ] ✅ `npm run build` - Compiles successfully
- [ ] ✅ No console errors
- [ ] ✅ Code is committed

**If all checked, you're ready to push!** 🚀

---

## Troubleshooting

### Pre-push script not found
```bash
# Make script executable
chmod +x backend/scripts/pre-push.sh
```

### Tests hanging
```bash
# Stop server if running
# Kill any processes on port 3000
lsof -ti:3000 | xargs kill -9
```

### Out of memory
```bash
# Increase Node memory
export NODE_OPTIONS=--max_old_space_size=4096
```

---

## Summary

**Quick Answer:** Run this before every PR:

```bash
cd backend && npm run pre-push
```

**That's it!** If it passes, your PR will pass CI/CD checks! ✅

---

## Time Estimates

| Command | Time | Use Case |
|---------|------|----------|
| `npm run pre-push:quick` | ~5s | Quick iteration |
| `npm run pre-push` | ~30s | Before pushing |
| `npm run test:watch` | Ongoing | Development |
| CI/CD Pipeline | ~8min | Automatic |

---

**Pro Tip:** Run `npm run test:watch` in a terminal while developing. It auto-runs tests on file changes, giving you instant feedback! 🎯

