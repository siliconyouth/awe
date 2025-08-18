import { NextResponse } from 'next/server'

// This API is for a future feature - extractedPattern model doesn't exist yet
export async function GET() {
  return NextResponse.json({ 
    message: "Pattern extraction feature coming soon",
    patterns: [],
    total: 0
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: "Pattern extraction feature coming soon" 
  })
}

export async function DELETE() {
  return NextResponse.json({ 
    message: "Pattern extraction feature coming soon" 
  })
}