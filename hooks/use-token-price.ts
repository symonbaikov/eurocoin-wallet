"use client";

import { useQuery } from "@tanstack/react-query";
import { type TokenPriceResult, getTokenPriceSync, getTokenPriceUsd } from "@/lib/pricing";

const TOKEN_PRICE_QUERY_KEY = ["token-price"] as const;

interface UseTokenPriceOptions {
  refetchInterval?: number;
}

interface UseTokenPriceResult extends TokenPriceResult {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<TokenPriceResult | undefined>;
  isFetching: boolean;
}

export function useTokenPrice(options?: UseTokenPriceOptions): UseTokenPriceResult {
  const revalidateMs = options?.refetchInterval ?? 60_000;

  const query = useQuery({
    queryKey: TOKEN_PRICE_QUERY_KEY,
    queryFn: getTokenPriceUsd,
    placeholderData: getTokenPriceSync(),
    refetchInterval: revalidateMs,
    staleTime: revalidateMs,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch on mount to get real-time price
  });

  return {
    priceUsd: query.data?.priceUsd ?? null,
    source: query.data?.source ?? "fixed",
    // eslint-disable-next-line react-hooks/purity
    fetchedAt: query.data?.fetchedAt ?? Date.now(),
    isLoading: query.isLoading,
    isError: query.isError,
    error: (query.error as Error | undefined) ?? null,
    refetch: async () => query.refetch().then((result) => result.data),
    isFetching: query.isFetching,
  };
}
