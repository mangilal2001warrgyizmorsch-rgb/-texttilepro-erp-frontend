"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "sonner";
import { Stamp, Search, CheckCircle2, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StampingPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "search">("pending");
  const [searchFilters, setSearchFilters] = useState({
    takaMarka: "",
    weaverChNo: "",
    weaverMarka: "",
    baleNo: "",
    lotNo: "",
    takaNo: "",
  });
  const [selectedTaka, setSelectedTaka] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const pendingLots = useQuery(api.stamping.listStampable, {});
  const searchResults = useQuery(
    activeTab === "search" ? api.stamping.searchTaka : "skip",
    searchFilters
  );

  // Mutations
  const stampMultiple = useMutation(api.stamping.stampMultiple);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
  };

  const toggleSelection = (taka: any) => {
    const isSelected = selectedTaka.some(
      (s) => s.orderId === taka.orderId && s.takaNo === taka.takaNo
    );
    if (isSelected) {
      setSelectedTaka(
        selectedTaka.filter(
          (s) => !(s.orderId === taka.orderId && s.takaNo === taka.takaNo)
        )
      );
    } else {
      setSelectedTaka([...selectedTaka, taka]);
    }
  };

  const handleConfirmStamping = async () => {
    setIsSubmitting(true);
    try {
      await stampMultiple({
        items: selectedTaka.map((s) => ({ orderId: s.orderId, takaNo: s.takaNo })),
      });
      toast.success(`${selectedTaka.length} Takas marked as Stamped`);
      setSelectedTaka([]);
      setConfirmOpen(false);
    } catch (error) {
      toast.error("Failed to confirm stamping");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Stamp className="text-primary" size={32} />
            Stamping Module
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Manage pending lots and confirm Taka stamping for processing.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "pending"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Lots
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "search"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Search Unstamped Taka
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === "pending" ? (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="font-semibold text-lg">Pending Lots for Stamping</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Lot No</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Master Name</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">Total Taka</TableHead>
                    <TableHead className="text-right">Total Meter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLots === undefined ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : pendingLots?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon"><Stamp className="opacity-20" size={48}/></EmptyMedia>
                            <EmptyTitle>No pending lots</EmptyTitle>
                            <EmptyDescription>All lots are currently stamped.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingLots.map((lot: any) => (
                      <TableRow key={lot._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => {
                        setSearchFilters({
                          takaMarka: "", 
                          weaverChNo: "", 
                          weaverMarka: "", 
                          baleNo: "",
                          lotNo: lot.lotNo,
                          takaNo: ""
                        });
                        setActiveTab("search");
                      }}>
                        <TableCell className="whitespace-nowrap">
                          {lot.date ? format(new Date(lot.date), "dd/MM/yyyy") : "N/A"}
                        </TableCell>
                        <TableCell className="font-bold text-primary">{lot.lotNo}</TableCell>
                        <TableCell>{lot.partyName}</TableCell>
                        <TableCell>{lot.masterName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">{lot.qualityName}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{lot.totalTaka}</TableCell>
                        <TableCell className="text-right font-medium">{lot.totalMeter}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Search size={20} className="text-primary" />
                  <h2 className="font-semibold text-lg">Search Unstamped Taka</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lotNo">Lot No</Label>
                    <Input
                      id="lotNo"
                      name="lotNo"
                      placeholder="e.g. L-123"
                      value={searchFilters.lotNo}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="takaNo">Taka No</Label>
                    <Input
                      id="takaNo"
                      name="takaNo"
                      placeholder="e.g. 90653"
                      value={searchFilters.takaNo}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="takaMarka">Taka Marka / Marka</Label>
                    <Input
                      id="takaMarka"
                      name="takaMarka"
                      placeholder="e.g. M/S 2"
                      value={searchFilters.takaMarka}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weaverChNo">Weaver Challan No</Label>
                    <Input
                      id="weaverChNo"
                      name="weaverChNo"
                      placeholder="e.g. W-123"
                      value={searchFilters.weaverChNo}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weaverMarka">Weaver Marka</Label>
                    <Input
                      id="weaverMarka"
                      name="weaverMarka"
                      placeholder="e.g. WM-123"
                      value={searchFilters.weaverMarka}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baleNo">Bale No</Label>
                    <Input
                      id="baleNo"
                      name="baleNo"
                      placeholder="e.g. B-001"
                      value={searchFilters.baleNo}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
                  <h3 className="font-semibold">Matching Taka</h3>
                  {searchResults && (
                    <span className="text-xs text-muted-foreground">
                      {searchResults.length} results found
                    </span>
                  )}
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Lot No</TableHead>
                        <TableHead>Taka No</TableHead>
                        <TableHead>Marka</TableHead>
                        <TableHead>Weaver Ch</TableHead>
                        <TableHead className="text-right">Meter</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults === undefined ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                          </TableRow>
                        ))
                      ) : searchResults?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                            No matching unstamped Taka found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        searchResults.map((taka: any) => {
                          const isSelected = selectedTaka.some(
                            (s) => s.orderId === taka.orderId && s.takaNo === taka.takaNo
                          );
                          return (
                            <TableRow 
                              key={`${taka.orderId}-${taka.takaNo}`}
                              className={`hover:bg-muted/50 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                              onClick={() => toggleSelection(taka)}
                            >
                              <TableCell>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                                  {isSelected && <CheckCircle2 size={14} />}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{taka.lotNo}</TableCell>
                              <TableCell>{taka.takaNo}</TableCell>
                              <TableCell>{taka.takaMarka || "-"}</TableCell>
                              <TableCell>{taka.weaverChNo || "-"}</TableCell>
                              <TableCell className="text-right font-mono font-bold">{taka.takaMeter}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-card border rounded-xl shadow-md overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b bg-primary text-primary-foreground flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 size={20} />
                Selection
              </h3>
              <Badge variant="secondary" className="font-bold">
                {selectedTaka.length} Selected
              </Badge>
            </div>
            
            <div className="p-0 max-h-[calc(100vh-350px)] overflow-y-auto">
              {selectedTaka.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    No Taka selected for stamping.
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Search and click on Taka to add them here.
                  </p>
                </div>
              ) : (
                <div className="divide-y border-b">
                  {selectedTaka.map((taka: any) => (
                    <div key={`${taka.orderId}-${taka.takaNo}`} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Lot: {taka.lotNo}
                          </span>
                          <span className="text-sm font-bold">Taka: {taka.takaNo}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">Marka: <span className="text-foreground font-medium">{taka.partyMarka}</span></span>
                          <span className="flex items-center gap-1">Meter: <span className="text-foreground font-medium font-mono">{taka.takaMeter}</span></span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => toggleSelection(taka)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-muted/10">
              <Button 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 gap-2" 
                disabled={selectedTaka.length === 0}
                onClick={() => setConfirmOpen(true)}
              >
                <Stamp size={20} />
                Confirm Stamping
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Stamping</DialogTitle>
            <DialogDescription asChild>
              <div className="pt-2">
                <div className="bg-muted/50 p-4 rounded-lg border space-y-3 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold uppercase text-[10px]">Total Selected</span>
                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedTaka.length} Taka</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-3">
                    <span className="text-muted-foreground font-bold uppercase text-[10px]">Total Meter</span>
                    <span className="font-bold text-foreground">
                      {selectedTaka.reduce((sum, t) => sum + (t.takaMeter || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-3">
                    <span className="text-muted-foreground font-bold uppercase text-[10px]">Stamping Date</span>
                    <span className="font-medium text-foreground">{format(new Date(), "dd MMM yyyy")}</span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  This will mark {selectedTaka.length} Taka as "Stamped" and they will be ready for the next process.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              className="gap-2 min-w-[140px]" 
              onClick={handleConfirmStamping}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



