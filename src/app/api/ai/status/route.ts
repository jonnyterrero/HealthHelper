import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'disconnected', 
          message: 'Python backend is not responding',
          url: PYTHON_API_URL 
        },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      status: 'connected',
      message: 'Python backend is healthy',
      url: PYTHON_API_URL,
      backend_status: data
    });
  } catch (error) {
    console.error('Error checking Python backend status:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: `Failed to connect to Python backend at ${PYTHON_API_URL}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

