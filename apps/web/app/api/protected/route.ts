import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Example of a protected API route
export async function GET() {
  try {
    // This will automatically handle authentication
    // If user is not authenticated, it will return 401
    const { userId, sessionClaims, orgId, orgRole, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Example: Check for admin role
    const isAdmin = sessionClaims?.metadata?.role === 'admin' || 
                    orgRole === 'org:admin';
    
    // Get session token for making backend requests
    const token = await getToken();
    
    return NextResponse.json({
      message: "This is a protected route",
      userId,
      orgId,
      orgRole,
      isAdmin,
      hasToken: !!token,
      sessionClaims: sessionClaims || {},
    });
  } catch (error) {
    console.error("Error in protected route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST example with role protection
export async function POST(request: Request) {
  try {
    // Check authentication and admin role
    const { userId, sessionClaims, orgRole } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check for admin role
    const isAdmin = sessionClaims?.metadata?.role === 'admin' || 
                    orgRole === 'org:admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Process admin-only action
    return NextResponse.json({
      message: "Admin action successful",
      data: data
    });
  } catch (error) {
    console.error("Error in protected POST route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}