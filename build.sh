#!/usr/bin/env bash
# Render build script for Rambam Log Dashboard

set -e  # Exit on error

echo "🔧 Installing Node.js dependencies..."
npm install

echo "🐍 Installing Python dependencies..."
pip install -r python/requirements.txt

echo "🏗️  Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
