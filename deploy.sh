#!/bin/bash
set -e

echo "🚀 Starting deployment to GitHub..."

# Initialize Git
if [ ! -d .git ]; then
    echo "Initializing local Git repository..."
    git init
    git branch -M main
fi

# Stage all files
echo "Staging files..."
git add index.html style.css app.js

# Commit changes
echo "Committing files..."
git commit -m "Initial commit of Chirag's Fitness Coach" || echo "Nothing new to commit."

# Create repo and push
REPO_NAME="daily-health-tracker"
USERNAME="chiragkode"

echo "Checking if repository '$REPO_NAME' already exists on GitHub..."
if gh repo view "$USERNAME/$REPO_NAME" >/dev/null 2>&1; then
    echo "Repository '$REPO_NAME' already exists. Linking remote and pushing..."
    if ! git remote get-url origin >/dev/null 2>&1; then
        git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"
    fi
    git push -u origin main --force
else
    echo "Creating new public GitHub repository '$REPO_NAME'..."
    gh repo create "$REPO_NAME" --public --source=. --push
fi

# Enable GitHub Pages via GitHub API
echo "Enabling GitHub Pages on main branch..."
# We wrap this in a try-catch echo since it might fail if Pages is already enabled
gh api -X POST /repos/$USERNAME/$REPO_NAME/pages \
  -f "source[branch]=main" -f "source[path]=/" || echo "Pages setup request finished (it may already be enabled)."

echo "🎉 Deployment initiated!"
echo "Your app will be live at: https://$USERNAME.github.io/$REPO_NAME/"
