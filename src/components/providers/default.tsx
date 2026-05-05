"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "./auth";
import { QueryClientProvider } from "./query-client";
import { Toaster } from "../ui/sonner";
import { TooltipProvider } from "../ui/tooltip";

const ThemeProvider = dynamic(() => import("./theme").then((mod) => mod.ThemeProvider), {
  ssr: false,
});

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider>
        <TooltipProvider>
          <ThemeProvider>
            <Toaster />
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
