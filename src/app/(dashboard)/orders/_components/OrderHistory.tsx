"use client";

import { useState, useEffect } from "react";
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
  // New Statuses
  "Order Created": "bg-slate-100 text-slate-600 border-slate-200",
  "Challan Created": "bg-sky-50 text-sky-600 border-sky-200",
  "Lot Created": "bg-indigo-50 text-indigo-600 border-indigo-200",
  "Stamping Done": "bg-pink-50 text-pink-600 border-pink-200",
  "In Process": "bg-orange-50 text-orange-700 border-orange-200",
  "Finish Meter Updated": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Ready for Dispatch": "bg-cyan-50 text-cyan-600 border-cyan-200",
  "Dispatched / Billed": "bg-violet-100 text-violet-700 border-violet-200",
  
  // Legacy Statuses (to support existing data)
  "draft": "bg-slate-100 text-slate-600 border-slate-200",
  "ChallanIssued": "bg-sky-50 text-sky-600 border-sky-200",
  "LotCreated": "bg-indigo-50 text-indigo-600 border-indigo-200",
  "Dispatched": "bg-violet-100 text-violet-700 border-violet-200",
};

const STATUS_LABELS: Record<string, string> = {
  // New Statuses
  "Order Created": "Order Created",
  "Challan Created": "Challan Created",
  "Lot Created": "Lot Created",
  "Stamping Done": "Stamping Done",
  "In Process": "In Process",
  "Finish Meter Updated": "Finish Meter Updated",
  "Ready for Dispatch": "Ready for Dispatch",
  "Dispatched / Billed": "Dispatched / Billed",

  // Legacy Statuses
  "draft": "Order Created",
  "ChallanIssued": "Challan Created",
  "LotCreated": "Lot Created",
  "Dispatched": "Dispatched / Billed",
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
  const orders = useQuery(api.orders.list, {}); // Fetch all orders
  const removeOrder = useMutation(api.orders.delete);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = (orders ?? []).filter((o) => {
    const matchSearch =
      o.partyName?.toLowerCase().includes(search.toLowerCase()) ||
      o.weaverName?.toLowerCase().includes(search.toLowerCase()) ||
      o.weaverChNo?.toLowerCase().includes(search.toLowerCase()) ||
      o.brokerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.codeMasterId?.masterName?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === "all" || o.status === statusFilter || (statusFilter === "Order Created" && o.status === "draft");
    
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filtered.slice(startIndex, startIndex + pageSize);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const handleDelete = async (order: any) => {
    if (order.status !== "Order Created") {
      toast.error("This order cannot be deleted because further process is already completed.");
      return;
    }

    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await removeOrder({ id: order._id });
      toast.success("Order deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
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
            placeholder="Search by party, master, weaver or challan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 border-l pl-3 border-border/50">
          <Filter size={14} className="text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px] bg-muted/20 border-none focus:ring-1 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Order Created">Order Created</SelectItem>
              <SelectItem value="Challan Created">Challan Created</SelectItem>
              <SelectItem value="Lot Created">Lot Created</SelectItem>
              <SelectItem value="Stamping Done">Stamping Done</SelectItem>
              <SelectItem value="In Process">In Process</SelectItem>
              <SelectItem value="Finish Meter Updated">Finish Meter Updated</SelectItem>
              <SelectItem value="Ready for Dispatch">Ready for Dispatch</SelectItem>
              <SelectItem value="Dispatched / Billed">Dispatched / Billed</SelectItem>
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
              {search
                ? "No orders match your filter criteria"
                : "Your inward order history will appear here"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : viewMode === "grid" ? (
        /* ═══ GRID VIEW ═══ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {paginatedOrders.map((o) => (
            <Card key={o._id} className="hover:shadow-md transition-all cursor-pointer group border-muted/60" onClick={() => setSelectedOrder(o)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{o.partyName || "Unknown Party"}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider line-clamp-1">Master: {o.codeMasterId?.masterName || o.brokerName || "N/A"}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-bold uppercase h-5 px-2", STATUS_COLORS[o.status])}>
                    {STATUS_LABELS[o.status] || o.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Weaver</span>
                    <span className="font-semibold line-clamp-1 text-right">{o.weaverName || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{o.totalTaka} Tk / {o.totalMeter.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">W. Challan</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">{o.weaverChNo || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {safeFormat(o.weaverChDate || o.orderDate || o.createdAt, "dd MMM yyyy")}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleDelete(o); }}
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
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Party Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Master Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Weaver Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Weaver Challan No</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Weaver Date</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Taka</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Meter</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs tracking-wider text-muted-foreground uppercase w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedOrders.map((o) => (
                  <tr
                    key={o._id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{o.partyName || "N/A"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{o.codeMasterId?.masterName || o.brokerName || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{o.weaverName || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{o.weaverChNo || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {safeFormat(o.weaverChDate || o.orderDate || o.createdAt, "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm font-medium">{o.totalTaka}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm font-medium text-primary">{o.totalMeter.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={cn("text-[9px] font-bold uppercase h-5 px-2", STATUS_COLORS[o.status])}>
                        {STATUS_LABELS[o.status] || o.status}
                      </Badge>
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
                          onClick={(e) => { e.stopPropagation(); handleDelete(o); }}
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
          <div className="px-4 py-3 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground order-2 sm:order-1">
              <span className="font-semibold text-foreground bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                {filtered.length} Orders Found
              </span>
              <span className="hidden sm:inline font-medium">
                Total: {filtered.reduce((s, o) => s + o.totalTaka, 0)} Taka · {filtered.reduce((s, o) => s + o.totalMeter, 0).toFixed(1)}m
              </span>
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <div className="flex items-center gap-1 mr-4">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">View</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-7 w-[70px] text-xs bg-background border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronRight size={14} className="rotate-180" />
                </Button>
                
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 3 + i;
                      if (pageNum + (5 - i - 1) > totalPages) {
                        pageNum = totalPages - 4 + i;
                      }
                    }
                    if (pageNum <= 0) return null;
                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
