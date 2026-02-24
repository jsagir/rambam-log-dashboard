#!/usr/bin/env bash
# Simplified build script for Rambam Log Dashboard
# Note: Python log processing done locally, dashboard-data.json committed to git

set -e  # Exit on error

echo "🔧 Installing Node.js dependencies..."
npm install

echo "🏗️  Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
