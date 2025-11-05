# CI/CD Setup Guide - GitHub Actions

## Overview

This guide explains how to set up and use the GitHub Actions CI/CD pipeline for Jaspers AI.

## What Gets Tested Automatically

Every time you push code or create a pull request, the following checks run automatically:

1. **✅ Code Linting** - ESLint checks for code quality
2. **✅ Code Formatting** - Prettier ensures consistent formatting  
3. **✅ Unit Tests** - Tests individual services and functions
4. **✅ E2E Tests** - Tests complete API endpoints
5. **✅ Build** - Verifies the application compiles correctly
6. **✅ Security Audit** - Checks for vulnerabilities in dependencies

## Setup Steps

### Step 1: Ensure Files Are in Place

Your repository should have:

```
.github/
└── workflows/
    └── ci.yml        # Main CI/CD workflow

backend/
├── src/
│   └── modules/auth/
│       └── auth.service.spec.ts    # Unit tests
├── test/
│   ├── auth.e2e-spec.ts             # E2E tests
│   └── jest-e2e.json                # E2E config
└── package.json                     # With test scripts
```

### Step 2: Push to GitHub

```bash
# Create a new branch for your changes
git checkout -b feature/add-tests-and-cicd

# Stage all new files
git add .github/
git add backend/src/modules/auth/auth.service.spec.ts
git add backend/test/auth.e2e-spec.ts
git add backend/test/jest-e2e.json
git add backend/TESTING_GUIDE.md
git add CICD_SETUP_GUIDE.md

# Commit
git commit -m "feat: add comprehensive tests and CI/CD pipeline

- Add unit tests for Auth Service (90%+ coverage)
- Add E2E tests for all auth endpoints
- Add GitHub Actions workflow with:
  * Linting and formatting checks
  * Unit and E2E tests with coverage
  * Build verification
  * Security auditing
- Add comprehensive testing documentation"

# Push to GitHub
git push origin feature/add-tests-and-cicd
```

### Step 3: Create Pull Request

1. Go to your repository on GitHub
2. Click "Compare & pull request"
3. Fill in the PR details
4. Click "Create pull request"

### Step 4: Watch CI Run

After creating the PR:

1. Click the "Checks" tab
2. You'll see all CI jobs running
3. Click on individual jobs to see detailed logs
4. Wait for all jobs to complete

## What the CI Pipeline Does

### Job 1: Lint & Format Check (~1 min)

```yaml
What it does:
- Checks out your code
- Installs dependencies
- Runs ESLint to check code quality
- Runs Prettier to verify formatting

Passes if:
- No linting errors
- Code follows formatting rules

Fails if:
- ESLint finds errors
- Code is not properly formatted
```

### Job 2: Unit Tests (~2 min)

```yaml
What it does:
- Runs all .spec.ts files
- Generates coverage report
- Uploads coverage to Codecov (optional)

Passes if:
- All unit tests pass
- No test failures or errors

Fails if:
- Any test fails
- Tests crash or hang
```

### Job 3: E2E Tests (~3 min)

```yaml
What it does:
- Starts PostgreSQL database
- Runs database migrations
- Executes E2E tests
- Tests real API endpoints

Passes if:
- Database starts successfully
- Migrations run correctly
- All E2E tests pass

Fails if:
- Database connection fails
- Migrations fail
- Any endpoint test fails
```

### Job 4: Build (~1 min)

```yaml
What it does:
- Compiles TypeScript to JavaScript
- Checks for compilation errors
- Verifies dist/ folder is created

Passes if:
- TypeScript compiles successfully
- No type errors
- Build artifacts exist

Fails if:
- Compilation errors
- Type errors
- Build fails
```

### Job 5: Security Audit (~1 min)

```yaml
What it does:
- Runs npm audit
- Checks for known vulnerabilities
- Scans dependencies

Passes if:
- No critical/high vulnerabilities
- Dependencies are safe

Fails if:
- Critical or high vulnerabilities found
- Dangerous dependencies detected
```

### Job 6: Summary

```yaml
What it does:
- Collects results from all jobs
- Displays summary table
- Marks CI as passed/failed

Shows:
✅ Lint | ✅ Unit Tests | ✅ E2E Tests | ✅ Build | ✅ Security
```

## Viewing CI Results

### On Pull Request

GitHub shows CI status on your PR:

```
All checks have passed ✓
- Lint & Format Check
- Unit Tests  
- E2E Tests
- Build Application
- Security Audit
```

### In Actions Tab

1. Go to repository → **Actions** tab
2. See list of all workflow runs
3. Click on any run to see details
4. Click on individual jobs for logs

### On Commits

Each commit shows a checkmark or X:
- ✅ Green checkmark = All checks passed
- ❌ Red X = Some checks failed
- 🟡 Yellow dot = Checks running

## When CI Fails

### Linting Failures

```bash
# View the errors in CI logs
# Then fix locally:
npm run lint

# Auto-fix most issues
npm run lint -- --fix

# Format code
npm run format
```

### Test Failures

```bash
# Run tests locally first
npm run test
npm run test:e2e

# Fix the failing tests
# Then push again
```

### Build Failures

```bash
# Check TypeScript errors
npm run build

# Fix type errors in your code
# Then commit and push
```

### Security Failures

```bash
# Check vulnerabilities
npm audit

# Try automatic fixes
npm audit fix

# For breaking changes
npm audit fix --force

# Check again
npm audit
```

## CI Best Practices

### 1. Test Locally First

```bash
# Before pushing, run:
npm run lint
npm run format
npm run test
npm run test:e2e
npm run build
```

### 2. Keep Dependencies Updated

```bash
# Check for updates
npm outdated

# Update carefully
npm update

# Test after updates
npm test
```

### 3. Write Meaningful Commit Messages

```bash
# Good commit messages
git commit -m "feat: add user registration endpoint with validation"
git commit -m "fix: correct password hashing in auth service"
git commit -m "test: add E2E tests for login flow"

# Bad commit messages
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "test"
```

### 4. Monitor CI Performance

- CI should complete in < 10 minutes
- If slower, optimize tests
- Use caching effectively
- Parallelize jobs when possible

## Customizing the CI Pipeline

### Change Node Version

```yaml
# In .github/workflows/ci.yml
env:
  NODE_VERSION: '18.x'  # Change this
```

### Add More Jobs

```yaml
# Add a new job
deploy:
  name: Deploy to Staging
  runs-on: ubuntu-latest
  needs: [build, test-e2e]
  
  steps:
    - name: Deploy
      run: |
        echo "Deploying to staging..."
```

### Skip CI for Specific Commits

```bash
# Add [skip ci] to commit message
git commit -m "docs: update README [skip ci]"
```

### Run CI on Specific Branches Only

```yaml
# In .github/workflows/ci.yml
on:
  push:
    branches: [ main, develop ]  # Only these branches
```

## Troubleshooting

### CI Stuck or Taking Too Long

**Cause**: Network issues or hanging tests

**Solution**:
- Check if tests hang locally
- Add timeouts to tests
- Cancel and re-run workflow

### Database Connection Errors in E2E

**Cause**: PostgreSQL service not starting

**Solution**:
- Check service configuration in ci.yml
- Verify environment variables
- Check database health check settings

### Cache Issues

**Cause**: Outdated npm cache

**Solution**:
```yaml
# In workflow file, update cache key
cache: 'npm'
cache-dependency-path: backend/package-lock.json
```

Or manually clear cache in GitHub Actions settings.

### Permission Errors

**Cause**: GitHub Actions doesn't have required permissions

**Solution**:
- Go to repo Settings → Actions → General
- Set workflow permissions to "Read and write"

## Advanced Features

### Code Coverage Reports

The pipeline uploads coverage to Codecov. To enable:

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Add `CODECOV_TOKEN` to GitHub Secrets
4. Coverage reports will appear on PRs

### Status Badges

Add to your README:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI%2FCD%20Pipeline/badge.svg)
```

### Slack/Discord Notifications

Add notification steps to workflow:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## CI/CD Roadmap

### Phase 1: Basic CI ✅ (Current)
- Linting
- Testing  
- Building
- Security auditing

### Phase 2: Enhanced CI (Next)
- Performance testing
- Load testing
- Integration testing with external APIs
- Database migration testing

### Phase 3: Continuous Deployment (Future)
- Auto-deploy to staging
- Auto-deploy to production (with approval)
- Rollback capabilities
- Blue-green deployments

## Quick Reference

### Test Locally

```bash
npm run lint        # Check code quality
npm run format      # Format code
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run build       # Build application
```

### View CI Status

```bash
# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch current run
gh run watch
```

### Debug CI

```bash
# Enable debug logging
# Add secret: ACTIONS_STEP_DEBUG=true

# Download logs
gh run download <run-id>
```

## Summary

Your CI/CD pipeline:
- ✅ Runs automatically on push/PR
- ✅ Tests code quality and functionality
- ✅ Verifies build and security
- ✅ Provides fast feedback
- ✅ Prevents bugs from reaching production

**Total CI Time**: ~8-10 minutes per run

**Cost**: Free on GitHub (2,000 minutes/month for private repos)

---

## Need Help?

- Check GitHub Actions [documentation](https://docs.github.com/en/actions)
- View workflow logs in Actions tab
- Ask in discussions or issues

Happy shipping! 🚀

