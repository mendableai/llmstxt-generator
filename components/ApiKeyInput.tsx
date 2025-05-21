import React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type ApiKeyInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  label = "Firecrawl API Key",
  placeholder = "Paste your Firecrawl API key",
}) => {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="api-key-input">{label}</Label>
      <Input
        id="api-key-input"
        type="password"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <span className="text-xs text-red-600 mt-1">{error}</span>
      )}
    </div>
  );
};