#!/bin/bash

# Get current date for branch name
DATE=$(date +"%m-%d-%Y-%H-%M")
BRANCH_NAME="god-chat/$DATE"

# Fetch latest changes from remote
git fetch origin

# Create new branch from latest main
git checkout main
git pull origin main
git checkout -b "$BRANCH_NAME"

# Stage all changes
git add .

# Get commit message from user
echo "Enter commit message: "
read COMMIT_MESSAGE

# Commit changes
if [ -n "$(git status --porcelain)" ]; then
    git commit -m "$COMMIT_MESSAGE"
    
    # Push changes
    git push origin "$BRANCH_NAME"
    
    echo "Changes committed and pushed to branch: $BRANCH_NAME"
else
    echo "No changes to commit"
fi