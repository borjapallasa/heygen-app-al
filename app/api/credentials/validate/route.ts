import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/credentials/validate
 * Validates a HeyGen API key by making a test request to HeyGen API
 */
export async function POST(req: NextRequest) {
  try {
    const { api_key } = await req.json();

    if (!api_key) {
      return NextResponse.json(
        { error: "api_key is required" },
        { status: 400 }
      );
    }

    // Test the API key by fetching avatar groups from HeyGen
    const response = await fetch("https://api.heygen.com/v2/avatar_group.list", {
      method: "GET",
      headers: {
        "X-Api-Key": api_key,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Invalid HeyGen API key" },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Error validating API key:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
