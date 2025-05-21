import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';
import { z } from "zod";

// Import processing modules
import { filterEnglishText } from '../../../lib/languageFilter';
import { removeHeadersFooters } from '../../../lib/headerFooterRemover';
import { exportCleanText } from '../../../lib/cleanTextExporter';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // --- Secure API key from header ---
    const firecrawlApiKey = request.headers.get("x-firecrawl-api-key") || process.env.FIRECRAWL_API_KEY;
    let maxUrls: number = firecrawlApiKey ? 100 : 10;
    let no_limit: boolean = !!request.headers.get("x-firecrawl-api-key");

    if (!firecrawlApiKey) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY is not set" },
        { status: 400 }
      );
    }

    // --- Zod schema validation ---
    const body = await request.json();
    const schema = z.object({
      url: z.string().trim().min(1, "URL is required").max(2048, "URL is too long").refine(
        (val) => {
          try {
            const url = new URL(val.startsWith("http") ? val : `https://${val}`);
            return ["http:", "https:"].includes(url.protocol);
          } catch {
            return false;
          }
        },
        { message: "Invalid URL format" }
      ),
      urls: z.array(z.string()).optional(),
      filterEnglish: z.boolean().optional(),
      removeHeadersFooters: z.boolean().optional(),
      cleanExport: z.boolean().optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }
    const {
      url,
      urls,
      filterEnglish = false,
      removeHeadersFooters: removeHeadersFootersOpt = false,
      cleanExport = false
    } = parsed.data;

    // --- End Zod validation ---

    const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not set" },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      return NextResponse.json(
        { error: `Failed to generate: ${results.error || "Unknown error"}` },
        { status: 500 }
      );
    }

    const llmstxt = !no_limit
      ? `*Note: This is an incomplete result, please enable full generation by entering a Firecrawl key.\n\n${results.data.llmstxt}`
      : results.data.llmstxt;

    const llmsFulltxt = results.data.llmsfulltxt;

    // === Enhanced Processing Pipeline ===
    let enhancedOutput = llmsFulltxt;

    try {
      // 1. Remove headers/footers if enabled
      if (removeHeadersFootersOpt) {
        const pages = enhancedOutput.split(/\n{2,}/);
        const cleanedPages = removeHeadersFooters(pages);
        enhancedOutput = cleanedPages.join('\n\n');
      }

      // 2. Filter English if enabled
      if (filterEnglish) {
        enhancedOutput = filterEnglishText(enhancedOutput);
      }

      // 3. Clean/export if enabled
      if (cleanExport) {
        enhancedOutput = exportCleanText(enhancedOutput);
      }
    } catch (err) {
      // Hide implementation details
      enhancedOutput = llmsFulltxt;
    }

    // Store in Supabase as before, sanitize input
    const { data, error } = await supabase
      .from('cache')
      .insert([
        {
          url: url.replace(/[\s\u200B-\u200D\uFEFF]/g, ""),
          llmstxt: llmstxt,
          llmsfulltxt: llmsFulltxt,
          no_limit: no_limit
        }
      ]);

    if (error) {
      return NextResponse.json(
        { error: "Failed to insert into Supabase" },
        { status: 500 }
      );
    }

    // Return enhanced output in addition to originals
    return NextResponse.json({
      llmstxt: llmstxt,
      llmsFulltxt: llmsFulltxt,
      enhancedOutput
    });
  } catch (err: any) {
    // Standardized error response, hide details
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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

  // === Enhanced Processing Pipeline ===
  let enhancedOutput = llmsFulltxt;

  try {
    // 1. Remove headers/footers if enabled
    if (removeHeadersFootersOpt) {
      // Split by double newline (page delimiter), fallback to single if only one page
      const pages = enhancedOutput.split(/\n{2,}/);
      const cleanedPages = removeHeadersFooters(pages);
      enhancedOutput = cleanedPages.join('\n\n');
    }

    // 2. Filter English if enabled
    if (filterEnglish) {
      enhancedOutput = filterEnglishText(enhancedOutput);
    }

    // 3. Clean/export if enabled
    if (cleanExport) {
      enhancedOutput = exportCleanText(enhancedOutput);
    }
  } catch (err) {
    console.error("Error in enhanced processing pipeline:", err);
    // Optionally, you could return an error or fallback to unprocessed output
  }

  // Store in Supabase as before
  const { data, error } = await supabase
    .from('cache')
    .insert([
      { url: url, llmstxt: llmstxt, llmsfulltxt: llmsFulltxt, no_limit: no_limit }
    ]);

  if (error) {
    throw new Error(`Failed to insert into Supabase: ${error.message}`);
  }

  // Return enhanced output in addition to originals
  return NextResponse.json({
    llmstxt: llmstxt,
    llmsFulltxt: llmsFulltxt,
    enhancedOutput
  });
}
