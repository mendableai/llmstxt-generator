"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
// import { CN_SMOOTH_SHADOW } from "./constants"; // Removed as likely specific to old design
import React, { useEffect, useState, useCallback } from "react";
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
import {
  CircleHelp,
  ExternalLinkIcon,
  Loader2,
  Bot,
  ShieldCheck,
  DollarSign,
  BarChart,
  CheckCircle,
  ArrowRight,
  Menu,
} from "lucide-react";
// import { dataMock } from "./data-mock"; // Removed mock data usage
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover"; // Keep if API info popover is needed elsewhere, otherwise remove
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Helper hook (kept from original)
function usePrevious<T>(value: T) {
  const ref = React.useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// Main Page Component
export default function Page() {
  // --- State Variables (kept from original) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prevIsModalOpen = usePrevious(isModalOpen);
  const [wantsFull, setWantsFull] = useState(false);
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mapUrls, setMapUrls] = useState<string[]>([]); // Keep for potential future use if generation result shows URLs
  const [scrapingStatus, setScrapingStatus] = useState<string>(""); // Keep for loading indicator
  // const [apiCallStatus, setApiCallStatus] = useState<string>(""); // Removed, simplified loading status
  const [finalMessage, setFinalMessage] = useState<{
    fullMessage: string;
    message: string;
    isFull: boolean;
  } | null>(null);
  const [
    retryWhenModalClosesWithFilledKey,
    setRetryWhenModalClosesWithFilledKey,
  ] = useState(false);

  // --- Derived State & Constants (kept/adapted from original) ---
  const hasKey = firecrawlKey.length > 0;
  const isFull = wantsFull && hasKey;
  const canSubmit = loading || !url; // Simplified submit condition

  // --- API Call Logic (kept/adapted from original) ---
  const callApi = useCallback(async () => {
    const currentIsFull = wantsFull && firecrawlKey.length > 0; // Recalculate inside callback
    let formattedUrl = url.trim().toLowerCase();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Basic URL validation before API call
    try {
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description:
          "Please enter a valid URL (e.g., example.com or https://example.com).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setFinalMessage(null); // Clear previous results
    setMapUrls([]); // Clear map URLs
    setScrapingStatus("Sending request...");

    try {
      // Simplified: Call a single endpoint that handles mapping and generation
      const response = await fetch("/api/generate", {
        // Assuming a new combined endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          full: currentIsFull, // Send flag based on current state
          apiKey: firecrawlKey, // Send key if available
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "An unknown error occurred." }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Assuming the API returns structure like { llmstxt: "...", llmsFulltxt: "...", mapUrls: [...] }
      setFinalMessage({
        fullMessage:
          data.llmsFulltxt || data.llmstxt || "No full content generated.", // Fallback
        message: data.llmstxt || "No content generated.", // Fallback
        isFull: currentIsFull,
      });
      setMapUrls(data.mapUrls || []); // Store map URLs if provided
    } catch (error: any) {
      console.error("API Call failed:", error);
      setFinalMessage(null);
      toast({
        title: "Generation Failed",
        description:
          error.message ||
          "Something went wrong. Please check the URL or try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setScrapingStatus("");
    }
  }, [url, wantsFull, firecrawlKey]); // Dependencies kept

  // --- Effects (kept/adapted from original) ---
  // Loading status effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (loading && mapUrls.length > 0) {
      // Simplified condition, maybe just use a generic "Processing..."
      setScrapingStatus("Processing your request...");
      // Removed complex interval logic, simple message is enough for now
    } else if (loading) {
      setScrapingStatus("Initiating request...");
    } else {
      setScrapingStatus("");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, mapUrls]); // Dependency kept, though interval logic removed

  // Retry effect after modal close
  useEffect(() => {
    if (
      prevIsModalOpen &&
      !isModalOpen &&
      hasKey &&
      retryWhenModalClosesWithFilledKey
    ) {
      setRetryWhenModalClosesWithFilledKey(false);
      callApi(); // Call API again if key was entered
    }
    // Reset wantsFull if modal is closed without a key
    if (prevIsModalOpen && !isModalOpen && !hasKey) {
      setWantsFull(false);
    }
  }, [
    prevIsModalOpen,
    isModalOpen,
    hasKey,
    retryWhenModalClosesWithFilledKey,
    callApi,
  ]); // Added callApi dependency

  // --- Event Handlers (kept/adapted from original) ---
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!url) {
        toast({
          title: "URL Required",
          description: "Please enter a website URL to generate its llms.txt.",
          variant: "destructive",
        });
        return;
      }
      callApi();
    },
    [url, callApi]
  );

  const handleSwitchChange = (checked: boolean) => {
    setWantsFull(checked);
    if (checked && !hasKey) {
      setIsModalOpen(true); // Open modal if switching to full without a key
    } else if (checked && hasKey) {
      // If already has key and wants full, maybe trigger generation immediately?
      // Or just let them click the button. Current behavior: just updates state.
    } else {
      // Switched off full generation
    }
  };

  const retryWithFullGeneration = useCallback(() => {
    setWantsFull(true);
    if (!hasKey) {
      setIsModalOpen(true);
      setRetryWhenModalClosesWithFilledKey(true); // Set flag to retry after modal closes with key
    } else {
      callApi(); // If key exists, just call API immediately
    }
  }, [hasKey, callApi]);

  // --- Navigation Data ---
  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Docs", href: "https://docs.rocketrank.ai", external: true }, // Example external link
  ];

  // --- Render ---
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-blue-50/50 dark:from-zinc-900 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* <Bot className="h-6 w-6 text-primary" /> */}
            🚀 
            <span className="font-semibold inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
               RocketRank
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {item.name}
                {item.external && (
                  <ExternalLinkIcon className="inline h-3 w-3 ml-1" />
                )}
              </Link>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button size="sm">
              Get Started <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="transition-colors hover:text-foreground text-foreground/80 text-lg"
                    >
                      {item.name}
                      {item.external && (
                        <ExternalLinkIcon className="inline h-4 w-4 ml-1" />
                      )}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-zinc-900 dark:via-black dark:to-teal-950 overflow-hidden">
          {/* Background shapes/gradients */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <svg
              className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-gray-200 dark:stroke-gray-700 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="e813992c-7d03-4cc4-a2bd-151760b470a0"
                  width="200"
                  height="200"
                  x="50%"
                  y="-1"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M100 200V.5M.5 .5H200" fill="none" />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                strokeWidth="0"
                fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)"
              />
            </svg>
          </div>
          <div className="container max-w-6xl mx-auto text-center px-2 relative z-10">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl mb-6">
                Make Your Website
                <div className="mt-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  AI-Ready
                </div>
              </h1>
              <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                AI is transforming how millions find products and services.
                Don't get left behind.
              </p>
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-4 mx-auto max-w-xl flex flex-col gap-4 items-center"
            >
              <div className="flex flex-col sm:flex-row gap-3 w-full p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-lg border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:focus-within:ring-offset-black">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  className="flex-grow !border-none !ring-0 !shadow-none bg-transparent text-base py-3 px-4"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  aria-label="Website URL"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto px-6 py-3"
                  disabled={canSubmit}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Try it now <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center space-x-2 mt-2 justify-center">
                <Switch
                  id="full-generation-switch"
                  checked={isFull}
                  onCheckedChange={handleSwitchChange}
                  disabled={loading}
                  aria-label="Enable full generation (requires API key)"
                />
                <Label
                  htmlFor="full-generation-switch"
                  className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                  Generate `llms-full.txt`
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <CircleHelp className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help hover:text-gray-600 dark:hover:text-gray-300" />
                  </PopoverTrigger>
                  <PopoverContent className="w-72 z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                    <p className="text-sm">
                      Enable this to generate a more comprehensive
                      `llms-full.txt` file. Requires a{" "}
                      <a
                        href="https://firecrawl.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-4"
                      >
                        Firecrawl API key
                      </a>
                      .
                    </p>
                    {!hasKey && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-2"
                        onClick={() => setIsModalOpen(true)}
                      >
                        Enter API Key
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center justify-center mt-6">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 rounded-full border border-gray-200 dark:border-zinc-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Backed by
                  </span>
                  <Image 
                    src="/yc.svg" 
                    alt="Y Combinator" 
                    width={20} 
                    height={20}
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Combinator
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    From the makers of
                  </span>
                  <a
                    href="https://firecrawl.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center"
                  >
                    Firecrawl <span className="ml-1">🔥</span>
                  </a>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                
              </p>
            </form>

            {/* Loading/Result Display Area */}
            {(loading || finalMessage) && (
              <div className="mt-8 mx-auto max-w-xl w-full">
                <div className="w-full min-h-[10rem] border border-gray-200 dark:border-zinc-700 rounded-lg p-4 text-sm font-mono bg-white dark:bg-zinc-800 shadow-inner text-left overflow-hidden">
                  {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <p>{scrapingStatus || "Generating..."}</p>
                    </div>
                  )}
                  {!loading && finalMessage && (
                    <div className="relative h-full">
                      <pre className="whitespace-pre-wrap break-words h-full max-h-96 w-full overflow-auto custom-scrollbar text-gray-800 dark:text-gray-200">
                        {finalMessage.isFull
                          ? finalMessage.fullMessage
                          : finalMessage.message}
                      </pre>
                      {!hasKey && !finalMessage.isFull && (
                        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm p-2 rounded border border-border text-xs">
                          For full results,{" "}
                          <button
                            onClick={retryWithFullGeneration}
                            className="font-medium text-primary hover:underline"
                          >
                            retry with a free Firecrawl key 🔥
                          </button>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            finalMessage.isFull
                              ? finalMessage.fullMessage
                              : finalMessage.message
                          );
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features Section (Three Ways to Win) */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl">
              Three Ways to Win in the AI Age
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg bg-card shadow-sm">
                <Bot className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Become AI-Discoverable
                </h3>
                <p className="text-muted-foreground">
                  Generate optimized files that AI crawlers and agents
                  understand, ensuring your brand appears in the new way people
                  search.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg bg-card shadow-sm">
                <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Control Your AI Presence
                </h3>
                <p className="text-muted-foreground">
                  Decide which AI crawlers can access your content, ensure
                  proper citation, and maintain ownership of your valuable work.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg bg-card shadow-sm">
                <DollarSign className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Monetize AI Usage
                </h3>
                <p className="text-muted-foreground">
                  Set pricing for your premium content and get paid each time an
                  AI service uses your intellectual property.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Button size="lg">
                Prepare Your Site <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Get Started Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50/50 to-white dark:from-black dark:to-zinc-900">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl mb-12">
              Get Started in Minutes
            </h2>
            <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-10 mx-auto max-w-2xl">
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900 text-primary font-bold">
                  1
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Scan Your Site
                </h3>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                  We'll analyze your current AI readiness score.
                </p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900 text-primary font-bold">
                  2
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Generate Optimized Files
                </h3>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                  Create AI-friendly content structures automatically.
                </p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900 text-primary font-bold">
                  3
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Control Access
                </h3>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                  Set your permissions and monetization preferences.
                </p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900 text-primary font-bold">
                  4
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Track Performance
                </h3>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                  Monitor your AI visibility and traffic.
                </p>
              </li>
            </ol>
            <div className="mt-12 text-center">
              <Button size="lg">
                Start Free Analysis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl mb-12">
              Pricing Plans
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Starter Plan */}
              <div className="flex flex-col rounded-lg border border-border shadow-sm p-6 bg-card">
                <h3 className="text-xl font-semibold mb-2">Starter</h3>
                <p className="text-4xl font-bold mb-4">
                  $29
                  <span className="text-base font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <ul className="space-y-2 text-muted-foreground flex-grow mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Basic AI readiness score
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Generated llms.txt file
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Limited crawler control
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Choose Starter
                </Button>
              </div>
              {/* Pro Plan */}
              <div className="flex flex-col rounded-lg border-2 border-primary shadow-lg p-6 bg-card relative">
                <div className="absolute top-0 right-4 -mt-3 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-full">
                  Most Popular
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Pro</h3>
                <p className="text-4xl font-bold mb-4">
                  $79
                  <span className="text-base font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <ul className="space-y-2 text-muted-foreground flex-grow mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full
                    AI visibility analytics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Complete crawler controls
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Content monetization tools
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Priority support
                  </li>
                </ul>
                <Button className="w-full">Choose Pro</Button>
              </div>
              {/* Enterprise Plan */}
              <div className="flex flex-col rounded-lg border border-border shadow-sm p-6 bg-card">
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-4xl font-bold mb-4">Contact Us</p>
                <ul className="space-y-2 text-muted-foreground flex-grow mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Custom implementation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Advanced monetization options
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Dedicated success manager
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> API
                    access
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Button size="lg" variant="link">
                See Full Feature Comparison{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready for the AI Revolution?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Don't let your competitors get ahead in the new era of discovery.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                variant="secondary"
                className="text-primary hover:bg-gray-100"
              >
                Make Your Site AI-Ready Today{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40 bg-background">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} 🚀 RocketRank. All rights reserved.
          Powered by{" "}
          <a
            href="https://firecrawl.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Firecrawl 🔥
          </a>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      {/* API Key Modal (kept from original) */}
      <Credenza
        open={isModalOpen}
        onOpenChange={(val) => {
          setIsModalOpen(val);
          // Logic moved to useEffect hook for clarity on close
        }}
      >
        <CredenzaContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsModalOpen(false); // Close modal on submit
            }}
            className="flex flex-col gap-4"
          >
            <CredenzaHeader>
              <CredenzaTitle>Enable Full Generation</CredenzaTitle>
              <CredenzaDescription>
                Enter your Firecrawl API key to generate the comprehensive
                `llms-full.txt` file. Keys are used solely for this generation
                request.
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <div className="flex flex-col gap-2">
                <Label htmlFor="firecrawl-key-modal" className="sr-only">
                  Firecrawl API Key
                </Label>
                <Input
                  id="firecrawl-key-modal"
                  disabled={loading} // Disable input if a generation is already in progress
                  autoFocus
                  placeholder="Paste your Firecrawl API key (fc-...)"
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                  type="password" // Use password type to obscure key
                />
                <a
                  href="https://firecrawl.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Don't have a key? Get one free on Firecrawl{" "}
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              </div>
            </CredenzaBody>
            <CredenzaFooter>
              <CredenzaClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </CredenzaClose>
              <CredenzaClose asChild>
                {/* Button type is submit to trigger form onSubmit */}
                <Button type="submit" disabled={!firecrawlKey}>
                  Save and Close
                </Button>
              </CredenzaClose>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}

// Removed PageContainer, Results, CN_LINK, API_INFO as they are replaced by new structure/styling
// Kept usePrevious hook
