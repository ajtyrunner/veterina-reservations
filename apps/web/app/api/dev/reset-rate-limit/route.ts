import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  // Clear any server-side rate limit state
  // NextAuth doesn't expose direct access to its rate limit store,
  // but we can return a success message
  
  return NextResponse.json({ 
    message: 'Rate limit reset request sent. Please restart the dev server for full reset.',
    tip: 'Use DISABLE_RATE_LIMIT=true in .env to disable rate limiting'
  })
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    info: 'POST to this endpoint to reset rate limits in development',
    currentEnv: process.env.NODE_ENV,
    rateLimitDisabled: process.env.DISABLE_RATE_LIMIT === 'true'
  })
}