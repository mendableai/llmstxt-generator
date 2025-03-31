import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from 'dotenv';
config();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const firecrawlApiKey = searchParams.get('FIRECRAWL_API_KEY') || request.headers.get('FIRECRAWL_API_KEY') || process.env.FIRECRAWL_API_KEY;

    if (!firecrawlApiKey) {
      return NextResponse.json(
        { error: 'FIRECRAWL_API_KEY is not set' },
        { status: 500 }
      );
    }

    // Initialize FirecrawlApp with the API key
    const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

    // Check the status of the generation job
    const status = await app.checkGenerateLLMsTextStatus(jobId);

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 