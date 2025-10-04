import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  
  // In a real app, validate against database
  // For now, check if it's a valid orchids key format
  return token.startsWith("orchids_") && token.length > 20;
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  // In a real app, fetch from database based on user associated with API key
  // For demo, return empty array
  return NextResponse.json({
    entries: [],
    message: "Connect your database to retrieve real entries"
  });
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // In a real app, save to database
    // For demo, return success
    return NextResponse.json({
      success: true,
      entry: body,
      message: "Entry created successfully (demo mode)"
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}