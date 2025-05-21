import { useState } from "react";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
};

type FetchResult<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  status?: number;
};

export function useDataFetch<T = any>() {
  const [result, setResult] = useState<FetchResult<T>>({
    data: null,
    error: null,
    loading: false,
    status: undefined,
  });

  const fetchData = async (
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResult<T>> => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { method = "POST", headers = {}, body } = options;
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      };
      const res = await fetch(url, fetchOptions);
      const contentType = res.headers.get("content-type");
      let data: any = null;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Unknown error occurred"
        );
      }
      setResult({ data, error: null, loading: false, status: res.status });
      return { data, error: null, loading: false, status: res.status };
    } catch (err: any) {
      setResult({
        data: null,
        error: err?.message || "Network error",
        loading: false,
        status: undefined,
      });
      return {
        data: null,
        error: err?.message || "Network error",
        loading: false,
        status: undefined,
      };
    }
  };

  const reset = () => {
    setResult({
      data: null,
      error: null,
      loading: false,
      status: undefined,
    });
  };

  return { ...result, fetchData, reset };
}