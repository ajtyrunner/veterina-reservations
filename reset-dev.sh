#!/bin/bash

echo "🔄 Restarting development server to clear rate limits..."
echo ""

# Kill existing processes
echo "⏹️  Stopping existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

sleep 2

# Clear NextAuth session store (if using file-based sessions)
rm -rf .next/cache 2>/dev/null || true

echo "✅ Processes stopped"
echo ""
echo "🚀 Starting fresh development server..."
echo "   Rate limiting is disabled (DISABLE_RATE_LIMIT=true)"
echo ""

# Start dev server
npm run dev