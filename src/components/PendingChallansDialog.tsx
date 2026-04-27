"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PendingChallansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PendingChallansDialog({
  open,
  onOpenChange,
}: PendingChallansDialogProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: challans, isLoading } = useQuery({
    queryKey: ["challans", "all", search],
    queryFn: () => api.get<any[]>("/challans?limit=100"), // Fetch more to ensure we find pending ones
    enabled: open,
  });

  const challansList = (challans as any)?.data || (Array.isArray(challans) ? challans : []);

  const filteredChallans = challansList.filter((challan: any) => {
    const status = (challan.status || "").toLowerCase();
    const isPending = status === "pending" || status === "active" || status === "pendingchallan";
    
    if (!isPending) return false;

    const searchTerm = search.toLowerCase();
    return (
      (challan.firmName || challan.firm || "").toLowerCase().includes(searchTerm) ||
      (challan.marka || challan.party || "").toLowerCase().includes(searchTerm) ||
      (challan.qualityName || challan.quality || "").toLowerCase().includes(searchTerm) ||
      (challan.challanNo || challan.challan_no || "").toLowerCase().includes(searchTerm)
    );
  });

  const handleSelect = (challan: any) => {
    onOpenChange(false);
    router.push(`/lots/new?challanId=${challan._id}`);
    toast.success(`Selected challan: ${challan.challanNo || challan.challan_no}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Select Pending Challan
          </DialogTitle>
          <DialogDescription>
            Choose a challan to create a production lot. All details will be auto-filled in the lot form.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search by challan no, firm, marka, or quality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 border-muted-foreground/20 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="border rounded-xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 bg-muted/5">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm text-muted-foreground font-medium">Fetching pending challans...</p>
              </div>
            ) : filteredChallans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground bg-muted/5">
                <p className="font-semibold text-foreground">No pending challans found</p>
                <p className="text-sm">Try searching for something else or check your challan history.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50 border-b">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-10">Challan No</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-10">Firm</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-10">Marka</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-10">Quality</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-10 text-right">Taka</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-10 text-right">Meter</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider h-10 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChallans.map((challan: any) => (
                    <TableRow key={challan._id} className="hover:bg-muted/30 transition-colors border-b last:border-0 group">
                      <TableCell className="py-3 font-bold text-foreground">
                        {challan.challanNo || challan.challan_no}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-medium">{challan.firmName || challan.firm}</TableCell>
                      <TableCell className="py-3 text-sm">{challan.marka || challan.party}</TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">{challan.qualityName || challan.quality}</TableCell>
                      <TableCell className="py-3 text-sm text-right font-medium">{challan.totalTaka || challan.taka}</TableCell>
                      <TableCell className="py-3 text-sm text-right font-bold text-primary">{Number(challan.totalMeter || challan.meter || 0).toFixed(1)}m</TableCell>
                      <TableCell className="py-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleSelect(challan)}
                          className="h-8 px-4 text-xs font-semibold bg-primary hover:opacity-90 shadow-sm"
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
