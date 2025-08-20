import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/session - Get session details and tokens
export async function GET() {
  try {
    const authResult = await auth();
    const { userId, sessionId, sessionClaims, getToken } = authResult;
    
    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }
    
    // Get different token types
    const sessionToken = await getToken();
    const customToken = await getToken({ template: 'custom' }).catch(() => null);
    
    // Get session details from Clerk backend
    const client = await clerkClient();
    const session = await client.sessions.getSession(sessionId);
    
    return NextResponse.json({
      session: {
        id: session.id,
        userId: session.userId,
        status: session.status,
        expireAt: session.expireAt,
        abandonAt: session.abandonAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      tokens: {
        hasSessionToken: !!sessionToken,
        hasCustomToken: !!customToken,
      },
      claims: sessionClaims || {},
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// DELETE /api/session - Sign out current session
export async function DELETE() {
  try {
    const { sessionId } = await auth();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }
    
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);
    
    return NextResponse.json({
      message: "Session revoked successfully"
    });
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}