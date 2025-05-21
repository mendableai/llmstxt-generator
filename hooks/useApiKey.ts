import { useState } from "react";
import { z } from "zod";

// Zod schema for API key validation (adjust regex as needed for Firecrawl keys)
const apiKeySchema = z
  .string()
  .min(32, "API key must be at least 32 characters")
  .max(128, "API key too long")
  .regex(/^[A-Za-z0-9\-_]+$/, "API key contains invalid characters");

export function useApiKey(initialValue = "") {
  const [apiKey, setApiKey] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  // Validate and sanitize input
  const handleChange = (value: string) => {
    // Remove whitespace and invisible characters
    const sanitized = value.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
    setApiKey(sanitized);

    const result = apiKeySchema.safeParse(sanitized);
    setError(result.success ? null : result.error.errors[0].message);
  };

  // For secure transmission: set as header
  const getHeader = () =>
    apiKey && !error
      ? { "x-firecrawl-api-key": apiKey }
      : {};

  // For form input: mask value, show error
  return {
    apiKey,
    setApiKey: handleChange,
    error,
    isValid: !error && apiKey.length > 0,
    getHeader,
    reset: () => {
      setApiKey("");
      setError(null);
    },
  };
}