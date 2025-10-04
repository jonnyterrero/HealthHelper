import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  return token.startsWith("orchids_") && token.length > 20;
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  // In a real app, generate insights from database
  return NextResponse.json({
    insights: [],
    message: "Connect your database to generate real insights"
  });
}