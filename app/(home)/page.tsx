"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CN_SMOOTH_SHADOW } from "./constants";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";
import { CircleHelp, ExternalLinkIcon, Loader2 } from "lucide-react";
import { dataMock } from "./data-mock";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";

export default function Page() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const prevIsModalOpen = usePrevious(isModalOpen);
  const [wantsFull, setWantsFull] = React.useState(false);
  const [firecrawlKey, setFirecrawlKey] = React.useState("");

  const [url, setUrl] = React.useState("");

  const hasKey = firecrawlKey.length > 0;
  const isFull = wantsFull && hasKey;

  const [loading, setLoading] = useState<boolean>(false);
  const [mapUrls, setMapUrls] = useState<string[]>([]);
  const [scrapingStatus, setScrapingStatus] = useState<string>("");
  const [apiCallStatus, setApiCallStatus] = useState<string>("");

  const [finalMessage, setFinalMessage] = useState<{
    fullMessage: string;
    message: string;
    isFull: boolean;
  } | null>(
    // Mocked data
    // {
    //   fullMessage: dataMock.fullApiMessage,
    //   message: dataMock.apiMessage,
    //   isFull: false,
    // }
    null
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && mapUrls.length > 0) {
      let index = 0;
      const messages = [
        (url: string) => `Scraping URL: ${url}`,
        (url: string) => `Extracting Title for URL: ${url}`,
        (url: string) => `Extracting Description for URL: ${url}`,
        (url: string) => `Adding URL to llms.txt: ${url}`,
      ];
      interval = setInterval(() => {
        const currentUrl = mapUrls[index];
        setScrapingStatus(messages[index % messages.length](currentUrl));
        index = (index + 1) % mapUrls.length;
      }, 750);
    } else {
      setScrapingStatus("");
    }
    return () => clearInterval(interval);
  }, [loading, mapUrls]);

  const callApi = React.useCallback(async () => {
    const isFull = wantsFull && hasKey;

    setLoading(true);
    try {
      const mapResponse = await fetch("/api/map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          bringYourOwnFirecrawlApiKey: firecrawlKey,
        }),
      });
      const mapData = await mapResponse.json();
      setMapUrls(mapData.mapUrls);
      const llmsResponse = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          urls: mapData.mapUrls,
          bringYourOwnFirecrawlApiKey: firecrawlKey,
        }),
      });
      const data = await llmsResponse.json();
      setFinalMessage({
        fullMessage: data.llmsFulltxt,
        message: data.llmstxt,
        isFull,
      });
    } catch (error) {
      setFinalMessage(null);
      toast({
        title: "Error",
        description: "Something went wrong, please try again later",
      });
    } finally {
      setLoading(false);
    }
  }, [url, wantsFull, hasKey, firecrawlKey]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      let inferredUrl = url;
      if (!inferredUrl.startsWith("http") && !inferredUrl.startsWith("https")) {
        inferredUrl = `https://${inferredUrl}`;
      }

      if (!inferredUrl) {
        toast({
          title: "Error",
          description: "Please enter a URL",
        });
        return;
      }

      try {
        new URL(inferredUrl);
      } catch {
        toast({
          title: "Error", 
          description: "Please enter a valid URL",
        });
        return;
      }

      callApi();
    },
    [url,callApi]
  );

  const [
    retryWhenModalClosesWithFilledKey,
    setRetryWhenModalClosesWithFilledKey,
  ] = useState(false);
  React.useEffect(() => {
    if (
      prevIsModalOpen &&
      !isModalOpen &&
      hasKey &&
      retryWhenModalClosesWithFilledKey
    ) {
      setRetryWhenModalClosesWithFilledKey(false);
      callApi();
    }
  }, [prevIsModalOpen, isModalOpen, hasKey, retryWhenModalClosesWithFilledKey]);
  const retryWithFullGeneration = React.useCallback(() => {
    setIsModalOpen(true);
    setWantsFull(true);

    setRetryWhenModalClosesWithFilledKey(true);
  }, []);

  const canSubmit = (!loading && !url) || loading;

  return (
    <PageContainer className="min-h-screen h-full flex items-center justify-center">
      <div className="w-full py-12 flex flex-col h-full justify-center items-center relative">
        <h1 className="text-center text-pretty text-3xl lg:text-5xl font-semibold font-mono tracking-tight">
          LLMs.txt generator
        </h1>
        <h2 className="text-center text-balance lg:text-lg mt-2">
          Generate consolidated text files from websites for LLM training and
          inference – Powered by{" "}
          <a href="https://firecrawl.dev" target="_blank" className={CN_LINK}>
            Firecrawl 🔥
          </a>
        </h2>

        <form
          onSubmit={handleSubmit}
          className={cn(
            CN_SMOOTH_SHADOW,
            "mt-6 w-full",
            "flex flex-col p-4 border-2 rounded-2xl focus-within:border-primary bg-card"
          )}
        >
          <Input
            placeholder="Enter a URL"
            className="!border-none focus-within:!ring-0 focus-within:!outline-none bg-transparent !shadow-none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {/* Action Bar */}
          <div className="w-full flex justify-between items-center space-y-6">
            {/* Left */}
            <div></div>

            {/* Right */}
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="airplane-mode"
                  disabled={loading}
                  checked={isFull}
                  onCheckedChange={(willCheck) => {
                    if (willCheck) {
                      setIsModalOpen(true);
                      setWantsFull(true);
                    } else {
                      setWantsFull(false);
                    }
                  }}
                />
                <Label htmlFor="airplane-mode">Full generation</Label>
              </div>
              <Button className="w-24" disabled={canSubmit}>
                {!loading && <span>Generate</span>}
                {loading && <Loader2 className="size-4 animate-spin" />}
              </Button>
            </div>
          </div>
        </form>

        <div className="w-full overflow-hidden flex flex-col gap-2 mt-4">
          <div className="relative w-full">
            <div className="w-full h-80 border rounded-2xl p-4 text-sm font-mono">
              {(!finalMessage || loading) && <div className="flex flex-col w-full h-full items-center justify-center text-balance text-center">
                <div className="max-w-72">
                  {!loading && (
                    <>
                      <p>Please provide a URL to generate a llms.txt file.</p>
                      <br />
                      <p>
                        For a better experience, use an API key from{" "}
                        <a
                          href="https://firecrawl.dev"
                          className={CN_LINK}
                          target="_blank"
                        >
                          Firecrawl 🔥
                        </a>
                        .
                      </p>
                      <br />
                      <p>
                        You can also call llms.txt it via{" "}
                        <Popover>
                          <PopoverTrigger asChild>
                            <span className="inline-flex items-center gap-1.5 cursor-help">
                              API <CircleHelp className="size-3.5" />
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-4 bg-background">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Access llms.txt via API by going to:
                                </p>
                                <code className="text-xs block bg-muted/60 p-3 rounded-md">
                                  http://llmstxt.firecrawl.dev/{"{YOUR_URL}"}
                                </code>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  For full results, add your Firecrawl API key:
                                </p>
                                <code className="text-xs block bg-muted/60 p-3 rounded-md">
                                  ?FIRECRAWL_API_KEY=YOUR_API_KEY
                                </code>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </p>
                    </>
                  )}
                  {loading && (
                    <>
                      <p>
                        {loading && !scrapingStatus && !apiCallStatus && <Loader2 className="size-4 animate-spin" />}
                        {loading && scrapingStatus && <>{scrapingStatus}</>}
                        {apiCallStatus && <>{apiCallStatus}</>}
                      </p>
                    </>
                  )}
                </div>
              </div>}

              {!loading && finalMessage && (
                <div className="whitespace-pre-wrap h-full w-full overflow-scroll custom-scrollbar">
                  {finalMessage.isFull
                    ? finalMessage.fullMessage
                    : finalMessage.message}
                  {!finalMessage.isFull && (
                    <div className="flex justify-center">
                      <div className="px-4 mt-8 mb-4">
                        For full results get a
                        <a
                          href="https://firecrawl.dev"
                          className={CN_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {" "}
                          free Firecrawl key 🔥
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {finalMessage && !loading && (
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(finalMessage.message);
                    toast({
                      title: "Copied to clipboard",
                      description:
                        "The result has been copied to your clipboard",
                    });
                  }}
                >
                  Copy
                </Button>

                {!finalMessage.isFull && (
                  <Button className="w-full" onClick={retryWithFullGeneration}>
                    Re-try with full generation
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Credenza
        open={isModalOpen}
        onOpenChange={(val) => {
          setIsModalOpen(val);
          if (!val) {
            if (firecrawlKey.length === 0) {
              toast({
                title: "Going normal mode",
                description: "Full generation requires an API key.",
              });
            }
          }
        }}
      >
        <CredenzaContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            setIsModalOpen(false);
          }} className="flex flex-col sm:gap-4">
            <CredenzaHeader>
              <CredenzaTitle>Enable full generation</CredenzaTitle>
              <CredenzaDescription>
                Please enter your Firecrawl API key to enable the full
                generation feature.
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <div className="flex flex-col">
                <Input
                  disabled={loading}
                  autoFocus
                  placeholder="Paste your Firecrawl API key"
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                />
                <a
                  href="https://firecrawl.dev"
                  target="_blank"
                  className="mt-2 text-sm hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Don't have a key? Create Firecrawl account{" "}
                  <ExternalLinkIcon className="size-4 mb-0.5" />
                </a>
              </div>
            </CredenzaBody>
            <CredenzaFooter>
              <CredenzaClose asChild>
                <Button type="submit">Save and return</Button>
              </CredenzaClose>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </PageContainer >
  );
}

const PageContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function PageContainer({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col mx-auto max-w-96 lg:max-w-xl px-8",
        className
      )}
      {...props}
    />
  );
});

const Results = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function Results({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col p-4 border-2 rounded-2xl focus-within:border-primary bg-background",
        className
      )}
      {...props}
    />
  );
});

const CN_LINK = `text-primary hover:text-primary/80 transition-colors`;

function usePrevious<T>(value: T) {
  const ref = React.useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const API_INFO = `You can access llms.txt via API by simply going to 'http://llmstxt.firecrawl.dev/{YOUR_URL}' or llms-full.txt via API with 'http://llmstxt.firecrawl.dev/{YOUR_URL}/full'. If you have a Firecrawl API key, you can use it by adding '?FIRECRAWL_API_KEY=YOUR_API_KEY' to the end of the URL for full results.`;
