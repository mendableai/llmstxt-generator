import { NextResponse } from 'next/server';
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js';
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js'
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import fetch from 'node-fetch';

export const maxDuration = 300; 

export async function POST(request: Request) {
  const { url,urls, bringYourOwnFirecrawlApiKey } = await request.json();
  let firecrawlApiKey: string | undefined;
  let limit: number = 100;
  let no_limit: boolean = false;
  let github: boolean = false;
  if (bringYourOwnFirecrawlApiKey) {
    firecrawlApiKey = bringYourOwnFirecrawlApiKey;
    console.log("Using provided Firecrawl API key. Limit set to 100");
    no_limit = true;
  } else {
    firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    limit = 10;
    console.log("Using default limit of 10");
  }

  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set');
  }

  const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

  let urlsToScrape = urls;

  //make sure url length is less than or equal to limit
  if (urlsToScrape && urlsToScrape.length > limit) {
    urlsToScrape = urlsToScrape.slice(0, limit);
  }
  const sampleUrl = urlsToScrape[0];
  let urlObj;
  if (sampleUrl.startsWith('http://') || sampleUrl.startsWith('https://')) {
    urlObj = new URL(sampleUrl);
  } else if (sampleUrl.startsWith('http:/') || sampleUrl.startsWith('https:/')) {
    urlObj = new URL(sampleUrl);
  } else {
    urlObj = new URL(`http://${sampleUrl}`);
  }
  
  const stemUrl = `${urlObj.hostname}`;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  const { data: cacheData, error: cacheError } = await supabase
    .from('cache')
    .select('llmstxt, llmsfulltxt, cached_at')
    .eq('url', url)
    .eq('no_limit', no_limit)
    .single();

  if (cacheError) {
    console.log('no cache hit');
  } else if (cacheData) {
    const cacheAge = (new Date().getTime() - new Date(cacheData.cached_at).getTime()) / (1000 * 60 * 60 * 24);
    if (cacheAge < 3) {
      console.log(`cache hit for ${stemUrl}`);
      return NextResponse.json({ llmstxt: cacheData.llmstxt, llmsFulltxt: cacheData.llmsfulltxt });
    }
  }

  let llmstxt = `# ${url} llms.txt\n\n`;
  let llmsFulltxt = `# ${url} llms-full.txt\n\n`;

  // Batch scrape the website

  if (!urls) {
    throw new Error('URLs are not defined');
  }

  if (stemUrl.includes('github.com')) {
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
    if (pathSegments.length >= 2) {
      github = true;
      const owner = pathSegments[0];
      const repo = pathSegments[1];
      const githubUrl = `https://uithub.com/${owner}/${repo}?maxTokens=1000&accept=text/markdown`;
      const response = await fetch(githubUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/markdown'
        }
      });

      if (response.ok) {
        const githubContent = await response.text();
        llmstxt += githubContent.split('/')[0];
        llmsFulltxt += githubContent.split('/')[0];
      } else {
        throw new Error(`Failed to fetch GitHub content: ${response.statusText}`);
      }
    }
  } else {

    // Scrape multiple websites (synchronous):
    const batchScrapeResult = await app.batchScrapeUrls(urls, {
      formats: ['markdown'],
      onlyMainContent: true,
    });

    if (!batchScrapeResult.success) {
      throw new Error(`Failed to scrape: ${batchScrapeResult.error}`);
    }

    for (const result of batchScrapeResult.data) {
      const metadata = result.metadata;
      const openai = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai"
    });

    const DescriptionSchema = z.object({
      description: z.string(),
      title: z.string(),
    });

    const completion = await openai.beta.chat.completions.parse({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "user",
          content: `Generate a 9-10 word description and a 3-4 word title of the entire page based on ALL the content one will find on the page for this url: ${metadata?.url}. This will help in a user finding the page for its intended purpose. Here is the content: ${result.markdown}`,
        }
      ],
      response_format: zodResponseFormat(DescriptionSchema, "description"),
    });

    const parsedResponse = completion.choices[0].message.parsed;
    const description = parsedResponse!.description;
    const title = parsedResponse!.title;
   
    llmstxt = llmstxt + `- [${title}](${metadata?.url}): ${description}\n`; 
    llmsFulltxt = llmsFulltxt + result.markdown;
  
    }
  }

  

  if (!no_limit || !github) {
    llmstxt = `*Note: This is llmstxt.txt is not complete, please enter a Firecrawl API key to get the entire llmstxt.txt at llmstxt.firecrawl.dev or you can access llms.txt via API with curl -X GET 'http://llmstxt.firecrawl.dev/${url}?FIRECRAWL_API_KEY=YOUR_API_KEY' or llms-full.txt via API with curl -X GET 'http://llmstxt.firecrawl.dev/${url}/full?FIRECRAWL_API_KEY=YOUR_API_KEY'\n\n` + llmstxt
    llmsFulltxt =  `*Note: This is llms-full.txt is not complete, please enter a Firecrawl API key to get the entire llms-full.txt at llmstxt.firecrawl.dev or you can access llms.txt via API with curl -X GET 'http://llmstxt.firecrawl.dev/${url}?FIRECRAWL_API_KEY=YOUR_API_KEY' or llms-full.txt via API with curl -X GET 'http://llmstxt.firecrawl.dev/${url}/full?FIRECRAWL_API_KEY=YOUR_API_KEY'\n\n` + llmsFulltxt
  }

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
