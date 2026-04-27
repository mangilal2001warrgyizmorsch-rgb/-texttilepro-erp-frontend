"use client";

import { useState } from "react";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
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

      <div className="flex-1 min-h-0 flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm mt-4">
        <div className="p-4 border-b bg-muted/20 shrink-0">
          <div className="relative flex w-full sm:w-64 items-center">
            <Input
              placeholder="Search challan, party, firm..."
              className="h-9 w-full rounded-full bg-background"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 sticky top-0 z-10 shadow-sm">
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    No challans found
                  </td>
                </tr>
              ) : (
                challans.map((c: any) => (
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
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          <Edit size={16} />
                        </Button>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
    </div>
  );
}
