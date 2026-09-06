import { NextRequest, NextResponse } from "next/server";

/**
 * Fetch Stitch design data
 * GET /api/stitch/design
 */
export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get("google_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. Please login first." },
        { status: 401 }
      );
    }

    const projectId = process.env.STITCH_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json(
        { error: "STITCH_PROJECT_ID not configured" },
        { status: 500 }
      );
    }

    // Fetch design from Stitch
    const response = await fetch(
      `https://stitch.googleapis.com/mcp/projects/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Stitch API error:", response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch design from Stitch" },
        { status: response.status }
      );
    }

    const design = await response.json();

    return NextResponse.json({
      success: true,
      design,
      projectId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Design fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
