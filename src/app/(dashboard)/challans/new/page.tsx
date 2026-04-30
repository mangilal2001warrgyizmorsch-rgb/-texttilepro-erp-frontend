"use client";

import { ChallanEntry } from "../_components/ChallanEntry";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewChallanPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed header */}
      <div className="shrink-0 border-b px-6 py-4 flex items-center gap-4 bg-card">
        <Link href="/challans">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Generate New Challan</h1>
          <p className="text-xs text-muted-foreground">Issue a challan against a draft order</p>
        </div>
      </div>

      {/* min-h-0 is the KEY — without it flex children won't shrink/scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 md:p-6 pb-20">
          <ChallanEntry />
        </div>
      </div>
    </div>
  );
}