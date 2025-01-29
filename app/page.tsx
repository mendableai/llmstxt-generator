"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [apiMessage, setApiMessage] = useState<string>("");
  const [fullApiMessage, setFullApiMessage] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showFullText, setShowFullText] = useState<boolean>(false);
  const [bringYourOwnFirecrawlApiKey, setBringYourOwnFirecrawlApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [apiKeySet, setApiKeySet] = useState<boolean>(false);
  const [mapUrls, setMapUrls] = useState<string[]>([]);
  const [scrapingMessage, setScrapingMessage] = useState<string>("");
  const [apiInfoMessage, setApiInfoMessage] = useState<string>("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && mapUrls.length > 0) {
      let index = 0;
      const messages = [
        (url: string) => `Scraping URL: ${url}`,
        (url: string) => `Extracting Title for URL: ${url}`,
        (url: string) => `Extracting Description for URL: ${url}`,
        (url: string) => `Adding URL to llms.txt: ${url}`
      ];
      interval = setInterval(() => {
        const currentUrl = mapUrls[index];
        setScrapingMessage(messages[index % messages.length](currentUrl));
        index = (index + 1) % mapUrls.length;
      }, 750);
    } else {
      setScrapingMessage("");
    }
    return () => clearInterval(interval);
  }, [loading, mapUrls]);

  const callApi = async () => {
    setLoading(true);
    try {
      const mapResponse = await fetch("/api/map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: inputUrl, bringYourOwnFirecrawlApiKey: bringYourOwnFirecrawlApiKey }),
      });
      const mapData = await mapResponse.json();
      setMapUrls(mapData.mapUrls);
      const llmsResponse = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: inputUrl, urls: mapData.mapUrls, bringYourOwnFirecrawlApiKey: bringYourOwnFirecrawlApiKey }),
      });
      const data = await llmsResponse.json();
      setApiMessage(data.llmstxt);
      setFullApiMessage(data.llmsFulltxt);
    } catch (error) {
      setApiMessage("Error calling API");
      setFullApiMessage("Error calling API");
    } finally {
      setLoading(false);
    }
  };

  const handleSetApiKey = () => {
    if (bringYourOwnFirecrawlApiKey.trim() === "") {
      alert("API key cannot be empty");
      return;
    }
    setApiKeySet(true);
    setShowApiKeyInput(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      
      <div className="flex flex-col items-center gap-4">
      <h1 className="text-6xl font-bold font-[family-name:var(--font-geist-mono)] mb-6">llms.txt Generator</h1>
        <div className="flex items-center gap-4">
          
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            placeholder="Enter URL"
          />
          <button
            onClick={callApi}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
        
        {loading && scrapingMessage && (
          <div className="text-sm text-gray-500">{scrapingMessage}</div>
        )}

        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-2 mt-6">
            {!apiKeySet ? (
              <>
                {showApiKeyInput ? (
                  <>
                    <input
                      type="text"
                      value={bringYourOwnFirecrawlApiKey}
                      onChange={(e) => setBringYourOwnFirecrawlApiKey(e.target.value)}
                      className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                      placeholder="Enter Firecrawl API key"
                    />
                    <button
                      onClick={handleSetApiKey}
                      className="text-blue-500 text-sm"
                    >
                      Set Firecrawl key 🔥
                    </button>
                  </>
                ) : (
                  <a
                    href="#"
                    onClick={() => setShowApiKeyInput(true)}
                    className="text-blue-500 text-sm"
                  >
                    Use your Firecrawl key 🔥
                  </a>
                )}
              </>
            ) : (
              <div className="text-green-500 text-sm">
                Firecrawl API key set
              </div>
            )}

            | <a href="#" onClick={() => setApiInfoMessage(apiInfoMessage ? "" : "You can access llms.txt via API by simply going to 'http://llmstxt.firecrawl.dev/{YOUR_URL}' or llms-full.txt via API with 'http://llmstxt.firecrawl.dev/{YOUR_URL}/full'. If you have a Firecrawl API key, you can use it by adding '?FIRECRAWL_API_KEY=YOUR_API_KEY' to the end of the URL for full results.")} className="text-blue-500 pointer-events-auto text-sm"> Use the llms.txt Generator API</a>
            
          </div>
          {apiInfoMessage && (
            <div className="relative w-1/2 text-sm text-black">{apiInfoMessage}</div>
          )}

          
          {apiMessage && (
              <>
            <div className="relative w-1/2">
              <div
                className={`text-sm font-[family-name:var(--font-geist-mono)] rounded border border-solid border-black/[.08] dark:border-white/[.145] transition-colors duration-300 ease-in-out hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent w-full h-80 p-4 overflow-hidden ${!bringYourOwnFirecrawlApiKey ? 'bg-gradient-to-b from-transparent to-white dark:to-black' : ''}`}
              >
                <div className="relative h-full overflow-auto">
                  <div className="relative whitespace-pre-wrap">
                    {showFullText ? fullApiMessage : apiMessage}
                    {!bringYourOwnFirecrawlApiKey && (
                      <div className="absolute top-0 left-0 w-full h-60 bg-gradient-to-b from-white dark:from-black to-transparent pointer-events-auto flex justify-center">
                        <div className="p-4">
                        For full results get a<a href="https://firecrawl.dev" className="text-blue-500 pointer-events-auto" target="_blank" rel="noopener noreferrer"> free Firecrawl key 🔥</a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
              <button
                onClick={() => navigator.clipboard.writeText(showFullText ? fullApiMessage : apiMessage)}
                className="mt-4 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
              >
                Copy {showFullText ? "llms-full-txt" : "llms.txt"}
              </button>
              
              {apiMessage.slice(-100) !== fullApiMessage.slice(-100) && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="ml-4 mt-4 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                >
                  {showFullText ? "Show llms.txt" : "Show llms-full.txt"}
                </button>
              )}
         
            </div>
            </div>
            </>
          )}
        </div>
    
      </div>
    </div>
  );
}
