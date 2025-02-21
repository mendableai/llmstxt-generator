import type { Metadata } from "next";

const url = "https://llmstxt.firecrawl.dev";
const title = `Free LLMs.txt Generator by Firecrawl`;
const description = `Generate consolidated text files from websites for LLM training and inference. Powered by Firecrawl.`;

export const defaultMetadata: Metadata = {
  title,
  description,
  keywords: [
    "llms.txt",
    "llms.txt generator",
    "firecrawl",
    "llms"
  ],
  publisher: "Firecrawl",
  metadataBase: new URL(url),
  openGraph: {
    siteName: "LLMs.txt Generator",
    url,
    title,
    description,
    type: "website",
    locale: "en",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LLMs.txt generator by Firecrawl",
      },
    ],
  },
  alternates: {
    canonical: url,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    site: "@firecrawl_dev",
    creator: "@firecrawl_dev",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow",
  },
  applicationName: "LLMs.txt Generator",
  appleWebApp: {
    title: "LLMs.txt Generator",
    statusBarStyle: "default",
    capable: true,
  },
  referrer: "no-referrer-when-downgrade",
  other: {
    HandheldFriendly: "True",
    MobileOptimized: "360",
    google: "notranslate",
  },
  icons: {
    shortcut: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
  },
};