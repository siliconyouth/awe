import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10),
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    nodeEnv: process.env.NODE_ENV,
    urls: {
      signIn: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      signUp: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      afterSignIn: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      afterSignUp: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    }
  })
}