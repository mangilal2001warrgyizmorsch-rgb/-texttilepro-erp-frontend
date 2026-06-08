"use client";

import { useState } from "react";
import { OrderHistory } from "./_components/OrderHistory";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api as baseApi } from "@/lib/api";
import { exportOrderEntryReport } from "@/utils/exportOrderEntryReport";

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OrdersUnifiedPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportOrders = async () => {
    setIsExporting(true);
    try {
      // Fetches ALL orders with complete nested takaDetails from GET /api/orders
      const orders = await baseApi.get<any[]>("/orders");

      if (!orders || orders.length === 0) {
        toast.warning("No order history data available to export.");
        return;
      }

      await exportOrderEntryReport(orders, `order-entry-export-${getToday()}`);

      toast.success("Order entry data exported successfully.");
    } catch (error: any) {
      console.error("Export failed:", error);
      toast.error("Failed to export order report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-muted/10">
      {/* Header */}
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grey Inward Management</h1>
            <p className="text-sm text-muted-foreground">Manage mill challans, quality specs, and lot generation</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              id="export-data-btn"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={handleExportOrders}
              className="cursor-pointer shadow-sm gap-2 h-10 px-5 text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border-primary/20 text-primary hover:bg-primary/5"
            >
              {isExporting ? (
                <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={18} strokeWidth={2.5} />
              )}
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
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
      </div>

      {/* History shown directly */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        <OrderHistory />
      </div>
    </div>
  );
}
