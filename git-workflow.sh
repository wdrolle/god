#!/bin/bash
# Make it executable: chmod +x git-workflow.sh
# Run it: ./git-workflow.sh

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    handle_error "Not in a git repository"
fi

# Create new branch with today's date
BRANCH_NAME="god-chat/$(date +%m-%d-%Y-%H-%M)"
echo "Creating branch: $BRANCH_NAME"

# Create and switch to new branch
git checkout -b "$BRANCH_NAME" || handle_error "Failed to create branch $BRANCH_NAME"

# Stage all changes
git add . || handle_error "Failed to stage changes"

# Get commit message
read -p "Enter commit message: " commit_message
git commit -m "$commit_message" || handle_error "Failed to commit changes"

# Push to remote with upstream tracking
git push -u origin "$BRANCH_NAME" || handle_error "Failed to push to remote"

echo "Successfully created and pushed branch: $BRANCH_NAME"
echo "When ready to merge, run:"
echo "git checkout main"
echo "git pull origin main"
echo "git merge $BRANCH_NAME"
echo "git push origin main"

# Helper commands printed at the end
echo -e "\nUseful stash commands:"
echo "git stash list                    # List all stashed changes"
echo "git stash show                    # Show the latest stash"
echo "git stash apply                   # Apply stash without removing it"
echo "git stash pop                     # Apply and remove the latest stash"
echo "git stash drop                    # Remove the latest stash"
echo "git stash clear                   # Remove all stashes" 
echo "git stash branch                  # Create a new branch from the latest stash"
echo "git stash list                    # List all stashes using git stash list"
echo "git checkout stash@{0} -- info.sh # Checkout the latest stash back into the codebase"