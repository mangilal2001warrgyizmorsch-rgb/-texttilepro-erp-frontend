"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("w-9 h-9 rounded-lg bg-muted/50 animate-pulse", className)} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-lg",
        "bg-muted/60 hover:bg-muted transition-all duration-300",
        "cursor-pointer group",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          isDark
            ? "opacity-0 rotate-90 scale-0"
            : "opacity-100 rotate-0 scale-100 text-amber-500"
        )}
      />
      <Moon
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          isDark
            ? "opacity-100 rotate-0 scale-100 text-blue-400"
            : "opacity-0 -rotate-90 scale-0"
        )}
      />
    </button>
  );
}
