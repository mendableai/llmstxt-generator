import { NextResponse } from 'next/server';
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js';
import { config } from 'dotenv';
config();

export const maxDuration = 300; 

export async function POST(request: Request) {
  const { url, bringYourOwnFirecrawlApiKey } = await request.json();
  let firecrawlApiKey: string | undefined;
  let limit: number = 100;
  console.log("url", url);

  if (bringYourOwnFirecrawlApiKey) {
    firecrawlApiKey = bringYourOwnFirecrawlApiKey;
    console.log("Using provided Firecrawl API key. Limit set to 100");
    
  } else {
    firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    limit = 10;
    console.log("Using default limit of 10");
  }

  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set');
  }

  const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

  let urlObj;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    urlObj = new URL(url);
  } else if (url.startsWith('http:/') || url.startsWith('https:/')) {
    urlObj = new URL(url);
  } else {
    urlObj = new URL(`http://${url}`);
  }

  let stemUrl = `${urlObj.hostname}`;

  // If the URL is a GitHub URL, include the owner and repo name in the stemUrl
  if (stemUrl.includes('github.com')) {
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
    if (pathSegments.length >= 2) {
      const owner = pathSegments[0];
      const repo = pathSegments[1];
      stemUrl = `${stemUrl}/${owner}/${repo}`;
    }
  }

  // Map a website
  const mapResult = await app.mapUrl(stemUrl, {
    limit: limit,
  });

  if (!mapResult.success) {
    throw new Error(`Failed to map: ${mapResult.error}`);
  }

  let urls = mapResult.success ? mapResult.links : [];

  return NextResponse.json({ mapUrls: urls });
}
