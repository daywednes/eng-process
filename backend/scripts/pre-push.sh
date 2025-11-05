#!/bin/bash

# Pre-Push Validation Script
# This script runs all checks that CI/CD will run to catch issues locally

set -e  # Exit on any error

echo "🚀 Running pre-push checks..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any check fails
CHECKS_PASSED=true

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 passed${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        CHECKS_PASSED=false
    fi
}

# 1. Linting
echo -e "${YELLOW}📝 Running ESLint...${NC}"
npm run lint
print_status "Linting"
echo ""

# 2. Code formatting check
echo -e "${YELLOW}🎨 Checking code formatting...${NC}"
npx prettier --check "src/**/*.ts" "test/**/*.ts"
print_status "Formatting"
echo ""

# 3. Unit tests
echo -e "${YELLOW}🧪 Running unit tests...${NC}"
npm run test
print_status "Unit tests"
echo ""

# 4. Build
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build
print_status "Build"
echo ""

# 5. Security audit (non-blocking, production deps only)
echo -e "${YELLOW}🔒 Running security audit (production dependencies)...${NC}"
npm audit --production --audit-level=high 2>/dev/null || echo -e "${YELLOW}⚠️  Security audit found issues (non-blocking)${NC}"
echo ""

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to push! 🚀${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix them before pushing.${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

