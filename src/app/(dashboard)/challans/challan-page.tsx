"use client";

import { useState } from "react";
import { Plus, Eye, Edit, Trash2, LayoutGrid, List, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import DraftOrdersDialog from "@/components/DraftOrdersDialog";
import { format } from "date-fns";

export default function ChallanPageWrapper() {
  const qc = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const { data, isLoading } = useQuery({
    queryKey: ["challan", page, search],
    queryFn: () =>
      api.get<any>(
        `/challans?page=${page}&limit=20${search ? `&search=${search}` : ""}`,
      ),
  });

  const challans = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-blue-100 text-blue-700",
    active: "bg-blue-600 text-white",
    lotcreated: "bg-emerald-600 text-white",
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return format(d, "dd MMM yyyy");
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Are you sure you want to delete challan #${c.challan_no}?`))
      return;
    try {
      await api.delete(`/challans/${c._id}`);
      toast.success("Challan deleted successfully!");
      qc.invalidateQueries({ queryKey: ["challan"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete challan");
    }
  };

  const handleSelectOrder = (orderId: string, orderData: any) => {
    // Navigate to new challan page with order ID
    router.push(`/challans/new?orderId=${orderId}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Mill Challans</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track delivery challans.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 gap-2 cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          Generate New Challan
        </Button>
      </div>

      <DraftOrdersDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectOrder={handleSelectOrder}
      />

      <div className="flex flex-wrap items-center gap-3 bg-card border p-3 rounded-xl shadow-sm mt-4">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            placeholder="Search challan, party, firm..."
            className="h-9 w-full rounded-full bg-muted/20 border-none focus-visible:ring-1 pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
              viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid size={14} />
            Grid
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
              viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List size={14} />
            Table
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 bg-muted/40 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : challans.length === 0 ? (
          <div className="py-20 text-center bg-card border-2 border-dashed rounded-3xl">
            <p className="text-muted-foreground">No challans found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
            {challans.map((c: any) => (
              <div key={c._id} className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-md transition-all group flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{c.challan_no}</span>
                      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase py-0 px-2 rounded-md border-transparent", STATUS_COLORS[(c.status || "draft").toLowerCase()] || STATUS_COLORS.draft)}>
                        {c.status || "Draft"}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground truncate max-w-[150px]">{c.firm}</p>
                  </div>
                  <Link href={`/challans/${c._id}`}>
                    <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 hover:bg-primary/10">
                      <Eye size={16} className="text-muted-foreground group-hover:text-primary" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Party:</span>
                    <span className="font-semibold truncate max-w-[120px]">{c.party}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-primary">{c.total || c.amount || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-muted-foreground font-medium">{formatDate(c.challan_date || c.date)}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Link href={`/challans/${c._id}/edit`} className="flex-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      <Edit size={12} className="mr-1" /> Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(c)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 sticky top-0 z-10 shadow-sm border-b">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Challan No
                    </th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Firm
                    </th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Party
                    </th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {challans.map((c: any) => (
                    <tr
                      key={c._id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium">{c.challan_no}</td>
                      <td className="px-5 py-3">
                        {formatDate(c.challan_date || c.date)}
                      </td>
                      <td className="px-5 py-3">{c.firm}</td>
                      <td className="px-5 py-3">{c.party}</td>
                      <td className="px-5 py-3 text-right font-medium">
                        {c.total || c.amount || "-"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize rounded-full font-medium border-transparent",
                            STATUS_COLORS[(c.status || "draft").toLowerCase()] ||
                              STATUS_COLORS.draft,
                          )}
                        >
                          {c.status || "Draft"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/challans/${c._id}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Link href={`/challans/${c._id}/edit`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              <Edit size={16} />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination inside table container for better alignment */}
            {totalPages > 1 && (
              <div className="p-3 border-t bg-muted/20 shrink-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-7 text-xs"
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-7 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
