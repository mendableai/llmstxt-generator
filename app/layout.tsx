import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Generate llms.txt",
  description: "Generate llms.txt for any website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-secondary-foreground`}
      >
        <div className="w-full bg-orange-500 py-2 text-center text-sm text-white">
          🎉 The official Firecrawl llms.txt endpoint is now available! 
          <a 
            href="https://docs.firecrawl.dev/features/alpha/llmstxt"
            className="ml-1 underline hover:text-orange-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more →
          </a>
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
