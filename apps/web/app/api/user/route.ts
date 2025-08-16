import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/user - Get current user information
export async function GET() {
  try {
    // Get authentication state
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get full user object
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Return user information
    return NextResponse.json({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}