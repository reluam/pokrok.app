#!/bin/bash

# Deploy to Staging
# Usage: ./scripts/deploy-staging.sh

set -e

echo "🚀 Deploying to Staging..."

# Check if we're on staging branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
    echo "⚠️  You're not on staging branch. Current branch: $CURRENT_BRANCH"
    read -p "Do you want to switch to staging and continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    git checkout staging
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin staging

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

# Push to staging
echo "📤 Pushing to staging..."
git push origin staging

echo "✅ Pushed to staging! Vercel will automatically deploy."
echo "🔗 Check your Vercel dashboard for the deployment URL."

