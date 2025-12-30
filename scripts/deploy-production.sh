#!/bin/bash

# Deploy to Production
# Usage: ./scripts/deploy-production.sh
# 
# NOTE: Default deployment goes to staging. Use this script ONLY for production.

set -e

echo "🚀 Deploying to PRODUCTION..."
echo ""
echo "⚠️  WARNING: You are about to deploy to PRODUCTION!"
echo "⚠️  Make sure you have tested everything on staging first!"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  You're not on main branch. Current branch: $CURRENT_BRANCH"
    read -p "Do you want to switch to main and merge staging? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Switch to main
    git checkout main
    git pull origin main
    
    # Merge staging into main
    echo "🔄 Merging staging into main..."
    git merge staging --no-ff -m "Merge staging into main for production deployment"
else
    # Pull latest changes
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes."
    read -p "Do you want to commit them? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Commit message: " COMMIT_MSG
        git commit -m "$COMMIT_MSG"
    else
        echo "❌ Please commit or stash your changes first."
        exit 1
    fi
fi

# Final confirmation
echo ""
echo "📋 Summary:"
echo "   Branch: $(git branch --show-current)"
echo "   Latest commit: $(git log -1 --oneline)"
echo ""
read -p "Push to production? (yes/no) " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Push to main (production)
echo "📤 Pushing to production..."
git push origin main

echo "✅ Pushed to production! Vercel will automatically deploy."
echo "🔗 Check your Vercel dashboard for the deployment."

