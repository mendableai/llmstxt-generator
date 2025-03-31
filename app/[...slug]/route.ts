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

    // Start the async generation process
    const result = await app.asyncGenerateLLMsText(targetUrl, generationParams);
    
    if (!result.success || !result.id) {
      throw new Error(`Failed to start generation: ${(result as any).error || "Unknown error"}`);
    }

    const jobId = result.id;
    
    // Generate a streaming HTML page that will poll for results
    const htmlPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LLMs.txt Generator</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #2563eb;
        }
        pre {
          background-color: #f1f5f9;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          white-space: pre-wrap;
          font-family: monospace;
        }
        .status {
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 5px;
        }
        .loading {
          background-color: #e0f2fe;
          border-left: 4px solid #0ea5e9;
        }
        .completed {
          background-color: #dcfce7;
          border-left: 4px solid #22c55e;
        }
        .error {
          background-color: #fee2e2;
          border-left: 4px solid #ef4444;
        }
        #result {
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>LLMs.txt Generator</h1>
      <div class="status loading" id="status">
        <p>Processing URL: <strong>${targetUrl}</strong></p>
        <p>Status: <span id="statusText">Starting...</span></p>
      </div>
      <div id="result"></div>
      <script>
        const jobId = "${jobId}";
        const targetUrl = "${targetUrl}";
        const isFullRequest = ${isFullRequest};
        const usingCustomApiKey = ${!!(searchParams.get('FIRECRAWL_API_KEY') || request.headers.get('FIRECRAWL_API_KEY'))};
        
        let resultElement = document.getElementById('result');
        let statusElement = document.getElementById('status');
        let statusTextElement = document.getElementById('statusText');
        
        function updateStatus(status, message) {
          statusTextElement.textContent = message;
          statusElement.className = \`status \${status}\`;
        }
        
        function updateResult(text) {
          const pre = document.createElement('pre');
          pre.textContent = text;
          resultElement.innerHTML = '';
          resultElement.appendChild(pre);
        }
        
        function addApiKeyNote(text) {
          if (!usingCustomApiKey) {
            return \`\${text} \\n\\n*Note: This is an incomplete result. To enable full generation, please provide your Firecrawl API key by either:
1. Adding the 'FIRECRAWL_API_KEY' header to your request (e.g., 'FIRECRAWL_API_KEY: your-api-key-here'), or
2. Including it as a query parameter (e.g., '?FIRECRAWL_API_KEY=your-api-key-here')\`;
          }
          return text;
        }
        
        function formatResponse(data) {
          if (isFullRequest && data.llmsfulltxt) {
            return addApiKeyNote(data.llmsfulltxt);
          } else if (data.llmstxt) {
            return addApiKeyNote(data.llmstxt);
          }
          return "No data available yet";
        }
        
        async function checkStatus() {
          try {
            const response = await fetch(\`/api/check-status/\${jobId}\`);
            const data = await response.json();
            
            if (data.error) {
              updateStatus('error', \`Error: \${data.error}\`);
              return false;
            }
            
            if (data.status === 'completed') {
              updateStatus('completed', 'Generation completed!');
              updateResult(formatResponse(data.data));
              return true;
            } else if (data.status === 'failed') {
              updateStatus('error', \`Generation failed: \${data.error || 'Unknown error'}\`);
              return true;
            } else {
              if (data.data && (data.data.llmstxt || data.data.llmsfulltxt)) {
                updateResult(formatResponse(data.data));
              }
              updateStatus('loading', \`\${data.status} - \${data.progress || 0}% complete\`);
              return false;
            }
          } catch (error) {
            console.error('Error checking status:', error);
            updateStatus('error', 'Error checking status');
            return false;
          }
        }
        
        // Poll for updates
        async function pollForUpdates() {
          const finished = await checkStatus();
          if (!finished) {
            setTimeout(pollForUpdates, 2000);
          }
        }
        
        // Start polling
        pollForUpdates();
      </script>
    </body>
    </html>
    `;
    
    return new Response(htmlPage, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
