"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, gcTime: 10 * 60_000, retry: 0, refetchOnWindowFocus: false, refetchOnReconnect: false },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider />
      {children}
    </QueryClientProvider>
  );
}
