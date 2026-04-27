"use client";

import { OrderHistory } from "./_components/OrderHistory";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function OrdersUnifiedPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-muted/10">
      {/* Header */}
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grey Inward Management</h1>
            <p className="text-sm text-muted-foreground">Manage mill challans, quality specs, and lot generation</p>
          </div>
          <Link href="/orders/new">
            <Button
              id="new-order-entry-btn"
              size="sm"
              className="cursor-pointer shadow-lg bg-primary hover:bg-primary/90 gap-2 h-10 px-5 text-sm font-semibold rounded-xl transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={2.5} />
              New Order Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* History shown directly */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        <OrderHistory />
      </div>
    </div>
  );
}
