"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Layers,
  Filter,
  Search,
  List,
  LayoutGrid,
  Eye,
  Trash2,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import PendingChallansDialog from "@/components/PendingChallansDialog";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  InStorage: "bg-slate-100 text-slate-700",
  InProcess: "bg-amber-100 text-amber-700",
  Finished: "bg-emerald-100 text-emerald-700",
  Dispatched: "bg-purple-100 text-purple-700",
  Pending: "bg-blue-100 text-blue-700",
};

export default function LotsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: lotResponse, isLoading } = useQuery({
    queryKey: ["lots", statusFilter],
    queryFn: () =>
      statusFilter === "Pending"
        ? api.get<any[]>("/challans?status=Active,Pending")
        : api.get<any[]>(
            `/lots${statusFilter ? `?status=${statusFilter}` : ""}`,
          ),
  });

  const rawLots =
    (lotResponse as any)?.data ||
    (Array.isArray(lotResponse) ? lotResponse : []);

  const lots = rawLots.filter((lot: any) => {
    const term = search.toLowerCase();
    return (
      (lot.lotNo || "").toLowerCase().includes(term) ||
      (lot.challanNo || lot.challan_no || "").toLowerCase().includes(term) ||
      (lot.partyName || lot.firm || lot.firmName || "")
        .toLowerCase()
        .includes(term) ||
      (lot.marka || lot.party || "").toLowerCase().includes(term) ||
      (lot.qualityName || lot.quality || "").toLowerCase().includes(term)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lot?")) return;
    try {
      await api.delete(`/lots/${id}`);
      toast.success("Lot deleted successfully");
      qc.invalidateQueries({ queryKey: ["lots"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete lot");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return "-";
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-muted/5">
      {/* Header */}
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Production Lots
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and track production batches across the facility
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-5 text-sm font-semibold rounded-xl transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Lot
          </Button>
        </div>

        <PendingChallansDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-card border p-3 rounded-xl shadow-sm mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <Input
              placeholder="Search lots, challans, parties..."
              className="pl-9 h-9 bg-muted/20 border-none focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 border-l pl-3 border-border/50">
            {(
              ["All", "Pending", "InStorage", "InProcess", "Finished"] as const
            ).map((s) => (
              <Button
                key={s}
                variant={
                  statusFilter === (s === "All" ? undefined : s)
                    ? "default"
                    : "ghost"
                }
                size="sm"
                onClick={() => setStatusFilter(s === "All" ? undefined : s)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold transition-all",
                  statusFilter === (s === "All" ? undefined : s)
                    ? "shadow-md bg-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {s === "Pending"
                  ? "Awaiting Lot"
                  : s === "InStorage"
                    ? "In Storage"
                    : s === "InProcess"
                      ? "In Process"
                      : s}
              </Button>
            ))}
          </div>

          <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid size={14} />
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List size={14} />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : lots.length === 0 ? (
          <Empty className="py-20 bg-card border-2 border-dashed rounded-3xl">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="bg-primary/10 text-primary p-4 rounded-full"
              >
                <Layers size={32} />
              </EmptyMedia>
              <EmptyTitle className="text-xl font-bold mt-4">
                No records found
              </EmptyTitle>
              <EmptyDescription className="max-w-xs mx-auto text-sm">
                Try adjusting your search or filters to find what you're looking
                for.
              </EmptyDescription>
              <Button
                onClick={() => setStatusFilter(undefined)}
                variant="link"
                className="text-primary font-bold"
              >
                Clear Filters
              </Button>
            </EmptyHeader>
          </Empty>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lots.map((item: any) => {
              const isChallan = statusFilter === "Pending" || !item.lotNo;
              return (
                <div
                  key={item._id}
                  className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-md transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">
                          {isChallan
                            ? item.challan_no || item.challanNo
                            : item.lotNo}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase py-0 px-2 rounded-md",
                            STATUS_COLORS[item.status] || "bg-muted",
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground truncate max-w-[150px]">
                        {isChallan
                          ? item.firm || item.firmName
                          : item.partyName}
                      </p>
                    </div>
                    {isChallan ? (
                      <Link href={`/lots/new?challanId=${item._id}`}>
                        <Button
                          size="icon"
                          className="rounded-full h-8 w-8 shadow-sm"
                        >
                          <Plus size={16} />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/lots/${item._id}`}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full h-8 w-8 hover:bg-primary/10"
                        >
                          <Eye
                            size={16}
                            className="text-muted-foreground group-hover:text-primary"
                          />
                        </Button>
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/40">
                    <div>
                      <p className="text-muted-foreground font-medium uppercase tracking-tighter">
                        Quality
                      </p>
                      <p className="font-bold truncate">
                        {item.qualityName || item.quality || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground font-medium uppercase tracking-tighter">
                        Total Meter
                      </p>
                      <p className="font-bold text-primary">
                        {(item.meter || item.totalMeter || 0).toFixed(1)}m
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider h-11">#</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-11">Lot / Challan</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-11">Party / Firm</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-11">Marka</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-right">Taka</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-right">Meter</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-center">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((item: any, idx: number) => {
                    const isChallan = statusFilter === "Pending" || !item.lotNo;
                    return (
                      <TableRow key={item._id} className="hover:bg-muted/30 group transition-colors">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-bold">
                          {isChallan ? (item.challan_no || item.challanNo) : item.lotNo}
                          <p className="text-[10px] font-medium text-muted-foreground">{formatDate(item.date || item.createdAt)}</p>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {isChallan ? (item.firm || item.firmName) : item.partyName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.marka || item.party || "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.taka || item.totalTaka || 0}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {(item.meter || item.totalMeter || 0).toFixed(1)}m
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("text-[10px] font-bold uppercase px-2 py-0 rounded-md", STATUS_COLORS[item.status] || "bg-muted")}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isChallan ? (
                              <Link href={`/lots/new?challanId=${item._id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                                  <Plus size={16} />
                                </Button>
                              </Link>
                            ) : (
                              <>
                                <Link href={`/lots/${item._id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                                    <Eye size={16} />
                                  </Button>
                                </Link>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      className="text-destructive font-semibold flex items-center gap-2"
                                      onClick={() => handleDelete(item._id)}
                                    >
                                      <Trash2 size={14} /> Delete Lot
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
