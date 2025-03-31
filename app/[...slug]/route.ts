import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from 'dotenv';
config();

export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const resolvedParams = await params;
    // Join the slug segments
    let rawUrl = resolvedParams.slug.join('/');
    console.log(`Raw URL from slug: ${rawUrl}`);
    
    // Normalize the URL
    let targetUrl = rawUrl;
    
    // Check for malformed protocols with only one slash
    if (targetUrl.match(/^https?:\/[^\/]/)) {
      // Convert https:/example.com to https://example.com
      targetUrl = targetUrl.replace(/^(https?:\/)([^\/].*)/, '$1/$2');
      console.log(`Fixed malformed protocol (missing slash): ${targetUrl}`);
    }
    // Check for protocol with right number of slashes
    else if (targetUrl.match(/^https?:\/\/.+/)) {
      // URL already has a valid protocol
      console.log(`URL has valid protocol: ${targetUrl}`);
    } 
    // No protocol at all
    else {
      // Add https:// protocol
      targetUrl = `https://${targetUrl}`;
      console.log(`Added protocol: ${targetUrl}`);
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

    // Set maxUrls based on whether user provided their own API key
    const maxUrls = searchParams.get('FIRECRAWL_API_KEY') || request.headers.get('FIRECRAWL_API_KEY') ? 100 : 10;
    
    // Define generation parameters
    const generationParams = {
      maxUrls,
      showFullText: true
    };

    // Check if the last segment is 'full'
    const isFullRequest = resolvedParams.slug[resolvedParams.slug.length - 1] === 'full';
    
    // Remove 'full' from targetUrl if present
    if (isFullRequest) {
      targetUrl = targetUrl.replace(/\/full$/, '');
    }

    console.log(`Processing URL: ${targetUrl}`);

    // Generate LLMs.txt directly
    const results = await app.generateLLMsText(targetUrl, generationParams);

    if (!results.success) {
      throw new Error(`Failed to generate: ${results.error || "Unknown error"}`);
    }

    // Format the response based on whether it's a full request
    if (isFullRequest) {
      
      const llmsFulltxt = results.data.llmsfulltxt;
      if (!llmsFulltxt) {
        console.error('llmsfulltxt is undefined in the response');
        return NextResponse.json(
          { error: 'llmsfulltxt is undefined in the response' },
          { status: 500 }
        );
      }

      let prettyPrintedFullTxt = JSON.stringify({ llmsfulltxt: llmsFulltxt }, null, 2)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/^\{\s*"llmsfulltxt":\s*"/, '')
        .replace(/"\s*\}$/, '');

      if (!searchParams.get('FIRECRAWL_API_KEY') && !request.headers.get('FIRECRAWL_API_KEY')) {
        prettyPrintedFullTxt = `${prettyPrintedFullTxt} \n\n*Note: This is an incomplete llmsfulltxt result. To enable full generation, please provide your Firecrawl API key by either:
1. Adding the 'FIRECRAWL_API_KEY' header to your request (e.g., 'FIRECRAWL_API_KEY: your-api-key-here'), or
2. Including it as a query parameter (e.g., '?FIRECRAWL_API_KEY=your-api-key-here')`;
      }

      return new Response(prettyPrintedFullTxt, {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Add note if using default API key with limited results
      let llmstxt = results.data.llmstxt;
      if (!searchParams.get('FIRECRAWL_API_KEY') && !request.headers.get('FIRECRAWL_API_KEY')) {
        llmstxt = `${llmstxt} \n\n*Note: This is an incomplete llmstxt result. To enable full generation, please provide your Firecrawl API key by either:
1. Adding the 'FIRECRAWL_API_KEY' header to your request (e.g., 'FIRECRAWL_API_KEY: your-api-key-here'), or
2. Including it as a query parameter (e.g., '?FIRECRAWL_API_KEY=your-api-key-here')`;
      }

      const prettyPrintedData = JSON.stringify({ llmstxt: llmstxt }, null, 2)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/^\{\s*"llmstxt":\s*"/, '')
        .replace(/"\s*\}$/, '');

      return new Response(prettyPrintedData, {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
