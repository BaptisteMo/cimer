#!/usr/bin/env bash

# Release script: Run checks, commit, and push
# Usage: ./scripts/release.sh

set -euo pipefail

# Colors for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🔍 Running pre-deploy checks (lint + typecheck + build)...${NC}"
echo ""

# Run all checks - this will exit if anything fails
if ! npm run check; then
  echo ""
  echo -e "${RED}❌ Checks failed. Please fix errors before releasing.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""

# Show current git status
echo -e "${BLUE}📋 Git status:${NC}"
git status --short
echo ""

# Check if there are any changes to commit
if [[ -z $(git status --porcelain) ]]; then
  echo -e "${YELLOW}⚠️  Nothing to commit. Working tree is clean.${NC}"
  echo ""
  exit 0
fi

# Prompt for commit message
read -rp "💬 Commit message: " msg

if [[ -z "$msg" ]]; then
  echo -e "${RED}❌ Commit message cannot be empty.${NC}"
  exit 1
fi

echo ""

# Stage all changes
echo -e "${BLUE}📦 Staging changes...${NC}"
git add .

# Commit
echo -e "${BLUE}💾 Committing...${NC}"
git commit -m "$msg"

# Get current branch name
branch=$(git rev-parse --abbrev-ref HEAD)

# Push to remote
echo ""
echo -e "${BLUE}🚀 Pushing to origin/${branch}...${NC}"
git push origin "$branch"

echo ""
echo -e "${GREEN}✅ Release complete!${NC}"
echo -e "${GREEN}   Branch '${branch}' pushed to GitHub${NC}"
echo -e "${GREEN}   Vercel will automatically deploy from this branch${NC}"
echo ""
