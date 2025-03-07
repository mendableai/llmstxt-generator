import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300;

export async function POST(request: Request) {
  const { url, urls, bringYourOwnFirecrawlApiKey } = await request.json();
  let firecrawlApiKey: string | undefined;
  let maxUrls: number = 100;
  let no_limit: boolean = false;

  if (bringYourOwnFirecrawlApiKey) {
    firecrawlApiKey = bringYourOwnFirecrawlApiKey;
    console.log("Using provided Firecrawl API key. Limit set to 100");
    no_limit = true;
  } else {
    firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    maxUrls = 10;
    console.log("Using default limit of 10");
  }

  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set');
  }

  const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  // Define generation parameters
  const params = {
    maxUrls,
    showFullText: true,
    urls
  };

  // Generate LLMs.txt with polling
  //@ts-ignore
  const results = await app.generateLLMsText(url, params);

  if (!results.success) {
    throw new Error(`Failed to generate: ${results.error || "Unknown error"}`);
  }

  const llmstxt = !bringYourOwnFirecrawlApiKey 
    ? `*Note: This is an incomplete result, please enable full generation by entering a Firecrawl key.\n\n${results.data.llmstxt}`
    : results.data.llmstxt;

  const llmsFulltxt = results.data.llmsfulltxt;

  const { data, error } = await supabase
    .from('cache')
    .insert([
      { url: url, llmstxt: llmstxt, llmsfulltxt: llmsFulltxt, no_limit: no_limit }
    ]);

  if (error) {
    throw new Error(`Failed to insert into Supabase: ${error.message}`);
  }

  return NextResponse.json({ llmstxt: llmstxt, llmsFulltxt: llmsFulltxt });
}
