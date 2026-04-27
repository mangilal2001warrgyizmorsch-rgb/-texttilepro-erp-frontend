"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Eye,
  Trash2,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrderDetailModal } from "./OrderDetailModal";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  PendingChallan: "bg-yellow-100 text-yellow-700",
  ChallanIssued: "bg-blue-100 text-blue-700",
  LotCreated: "bg-purple-100 text-purple-700",
  InProcess: "bg-orange-100 text-orange-700",
  Completed: "bg-green-100 text-green-700",
  Dispatched: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  PendingChallan: "Pending Challan",
  ChallanIssued: "Challan Issued",
  LotCreated: "Lot Created",
  InProcess: "In Process",
  Completed: "Completed",
  Dispatched: "Dispatched",
};

// Helper function to safely parse dates
function getSafeDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Safely format a date value, return placeholder on failure
function safeFormat(dateValue: any, fmt: string, placeholder = "-") {
  try {
    return format(getSafeDate(dateValue), fmt);
  } catch {
    return placeholder;
  }
}
export function OrderHistory() {
  const orders = useQuery(api.orders.list, {});
  const removeOrder = useMutation(api.orders.delete);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filtered = (orders ?? []).filter((o) => {
    const matchSearch =
      o.firmName.toLowerCase().includes(search.toLowerCase()) ||
      o.marka.toLowerCase().includes(search.toLowerCase()) ||
      o.qualityName.toLowerCase().includes(search.toLowerCase()) ||
      o.challanNo?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await removeOrder({ id });
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters + View Toggle */}
      <div className="flex gap-3 flex-wrap items-center bg-card border p-3 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="order-search-input"
            className="pl-9 h-9 bg-muted/20 border-none focus-visible:ring-1"
            placeholder="Search by mill, marka, quality or challan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter size={14} className="text-muted-foreground" />
           <Select value={filterStatus} onValueChange={setFilterStatus}>
             <SelectTrigger className="w-44 h-9 bg-muted/20 border-none">
               <SelectValue placeholder="All Statuses" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Statuses</SelectItem>
               {Object.entries(STATUS_LABELS).map(([key, label]) => (
                 <SelectItem key={key} value={key}>{label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border">
          <button
            id="view-grid-btn"
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid size={14} />
            Grid
          </button>
          <button
            id="view-table-btn"
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
              viewMode === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List size={14} />
            Table
          </button>
        </div>
      </div>

      {/* List */}
      {orders === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><ShoppingCart /></EmptyMedia>
            <EmptyTitle>No history found</EmptyTitle>
            <EmptyDescription>
              {search || filterStatus !== "all"
                ? "No orders match your filter criteria"
                : "Your inward order history will appear here"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : viewMode === "grid" ? (
        /* ═══ GRID VIEW ═══ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((o) => (
            <Card key={o._id} className="hover:shadow-md transition-all cursor-pointer group border-muted/60" onClick={() => setSelectedOrder(o)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{o.firmName}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Challan: {o.challanNo || "N/A"}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-bold uppercase h-5 px-2", STATUS_COLORS[o.status])}>
                    {STATUS_LABELS[o.status]}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Quality</span>
                    <span className="font-semibold">{o.qualityName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{o.totalTaka} Tk / {o.totalMeter.toFixed(1)}m</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Marka</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">{o.marka}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {safeFormat(o.orderDate || o.createdAt, "dd MMM yyyy")}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleDelete(o._id); }}
                    >
                      <Trash2 size={13} />
                    </Button>
                    <div className="h-7 w-7 flex items-center justify-center bg-primary/10 text-primary rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                       <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* ═══ TABLE VIEW ═══ */
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Mill / Firm</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Challan No</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Quality</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Marka</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Taka</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Meter</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Date</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((o) => (
                  <tr
                    key={o._id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{o.firmName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{o.challanNo || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{o.qualityName}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{o.marka}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm font-medium">{o.totalTaka}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm font-medium text-primary">{o.totalMeter.toFixed(1)}m</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={cn("text-[9px] font-bold uppercase h-5 px-2", STATUS_COLORS[o.status])}>
                        {STATUS_LABELS[o.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                      {safeFormat(o.orderDate || o.createdAt, "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleDelete(o._id); }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Table Footer */}
          <div className="px-4 py-3 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} order{filtered.length !== 1 ? "s" : ""} found</span>
            <span className="font-medium">
              Total: {filtered.reduce((s, o) => s + o.totalTaka, 0)} Taka · {filtered.reduce((s, o) => s + o.totalMeter, 0).toFixed(1)}m
            </span>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
