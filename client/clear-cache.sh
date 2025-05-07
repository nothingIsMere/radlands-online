#!/bin/bash

# Display information about what the script does
echo "=== Clearing Vite Cache and Reinstalling Dependencies ==="
echo "This script will:"
echo "1. Remove the Vite cache directory"
echo "2. Reinstall all dependencies"
echo ""

# Remove the .vite cache directory
echo "Removing Vite cache..."
rm -rf node_modules/.vite

# Check if node_modules exists, if not create directory
if [ ! -d "node_modules" ]; then
  mkdir -p node_modules
  echo "Created node_modules directory"
fi

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

echo ""
echo "=== Cache cleared and dependencies reinstalled ==="
echo "You can now run 'npm run dev' to start the development server."