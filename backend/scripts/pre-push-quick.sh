#!/bin/bash

# Quick Pre-Push Script (skips slow checks)
# For faster feedback during development

set -e

echo "⚡ Running quick pre-push checks..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=true

print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 passed${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        CHECKS_PASSED=false
    fi
}

# 1. Linting (fast)
echo -e "${YELLOW}📝 Linting...${NC}"
npm run lint
print_status "Linting"

# 2. Build (fast)
echo -e "${YELLOW}🔨 Building...${NC}"
npm run build > /dev/null 2>&1
print_status "Build"

echo ""
if [ "$CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✅ Quick checks passed! Run 'npm run pre-push' for full validation.${NC}"
    exit 0
else
    echo -e "${RED}❌ Quick checks failed.${NC}"
    exit 1
fi

