"use client";

import { AuthProvider } from "./auth";
import { QueryClientProvider } from "./query-client";
import { Toaster } from "../ui/sonner";
import { TooltipProvider } from "../ui/tooltip";

import { ThemeProvider } from "./theme";

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
