"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { api as baseApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  QrCode,
  Save,
  Loader2,
  AlertCircle,
  Info,
  ArrowRight,
  ListChecks,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function TPEntryModal({
  open,
  onClose,
  lotData,
  taka,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  lotData: any;
  taka: any;
  onSuccess: () => void;
}) {
  const [newRows, setNewRows] = useState<any[]>([{ id: Date.now(), meter: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const saveTpEntries = useMutation(api.production.saveTpEntries);

  if (!taka || !lotData) return null;

  const handleAddRow = () => {
    setNewRows([...newRows, { id: Date.now(), meter: "" }]);
  };

  const handleRemoveRow = (id: number) => {
    if (newRows.length > 1) {
      setNewRows(newRows.filter((r) => r.id !== id));
    } else {
      setNewRows([{ id: Date.now(), meter: "" }]);
    }
  };

  const handleRowChange = (id: number, value: string) => {
    setNewRows(newRows.map((r) => (r.id === id ? { ...r, meter: value } : r)));
  };

  // Calculations
  const existingFinish = taka.finishMeter || 0;
  const currentAddedTotal = newRows.reduce(
    (acc, row) => acc + (Number(row.meter) || 0),
    0,
  );
  const finalTotal = existingFinish + currentAddedTotal;
  const finalPending = Math.max(0, taka.greyMeter - finalTotal);
  const shortMeter = Math.max(0, taka.greyMeter - finalTotal);
  const shortagePercent =
    taka.greyMeter > 0 ? (shortMeter / taka.greyMeter) * 100 : 0;

  const handleSave = async (isComplete: boolean) => {
    const validEntries = newRows
      .filter((r) => r.meter && !isNaN(Number(r.meter)) && Number(r.meter) > 0)
      .map((r) => ({ finishMeterAdded: Number(r.meter) }));

    if (validEntries.length === 0) {
      toast.error("Please enter at least one valid finish meter amount.");
      return;
    }

    setSubmitting(true);
    try {
      await saveTpEntries({
        orderId: lotData.lot.orderId,
        takaIndex: taka.takaIndex,
        entries: validEntries,
        isComplete,
      });
      toast.success("TP Entries saved successfully!");
      setNewRows([{ id: Date.now(), meter: "" }]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save entries");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (pending: number, total: number, grey: number) => {
    if (pending === 0)
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
    if (total > grey)
      return <Badge variant="destructive">Excess</Badge>;
    if (total > 0)
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">TP Pending</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-muted shadow-xl">
        <DialogHeader className="p-4 md:p-6 border-b bg-muted/20">
          <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            <Info className="text-primary" size={20} /> TP (Taka Pending) Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {/* Header Info Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-muted/10 rounded-xl border border-border">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Party</p>
              <p className="font-semibold text-sm truncate" title={lotData.lot.partyName}>{lotData.lot.partyName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Marka</p>
              <p className="font-semibold text-sm">{lotData.lot.marka}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Lot No</p>
              <p className="font-bold text-base text-primary">{lotData.lot.lotNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Taka No</p>
              <p className="font-bold text-base">{taka.takaNo || `Sr ${(taka.takaIndex ?? 0) + 1}`}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Quality</p>
              <p className="font-semibold text-xs truncate" title={lotData.lot.qualityName}>{lotData.lot.qualityName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Grey Meter</p>
              <p className="font-bold text-base font-mono">{taka.greyMeter}m</p>
            </div>
          </div>

          {/* TP History Section */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm flex items-center gap-2 text-muted-foreground">
              <ListChecks size={16} /> History
            </h4>
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="max-h-32 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-12 text-center text-[10px] font-bold uppercase">Sr</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase">Added</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase">Pending</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taka.tpEntries && taka.tpEntries.length > 0 ? (
                      taka.tpEntries.map((e: any, i: number) => (
                        <TableRow key={i} className="h-10">
                          <TableCell className="text-center font-medium text-xs py-1">{i + 1}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground py-1">
                            {new Date(e.entryDate).toLocaleDateString()} {new Date(e.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-600 py-1">
                            +{e.finishMeter.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs py-1">
                            {e.pendingMeter.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-[11px] py-1">{e.userName}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6 italic text-xs">
                          No previous records.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* New Entry Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2 text-primary">
                <Plus size={16} /> New TP Entries
              </h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddRow}
                className="h-8 gap-2 text-xs font-bold"
              >
                <Plus size={14} /> Add Row
              </Button>
            </div>

            <div className="border rounded-xl bg-muted/5 p-4 space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] font-bold uppercase text-muted-foreground pb-2 border-b">
                <div className="col-span-1 text-center">Sr</div>
                <div className="col-span-3">TP Entry Meter</div>
                <div className="col-span-3 text-center">Total Finish</div>
                <div className="col-span-2 text-center">Pending</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-3">
                {newRows.map((row, index) => {
                  const rowVal = Number(row.meter) || 0;
                  const runningPrev = newRows
                    .slice(0, index)
                    .reduce((acc, r) => acc + (Number(r.meter) || 0), 0);
                  const rowTotal = existingFinish + runningPrev + rowVal;
                  const rowPending = Math.max(0, taka.greyMeter - rowTotal);

                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center bg-background border rounded-lg p-3 md:p-1"
                    >
                      <div className="md:col-span-1 text-center font-bold text-muted-foreground text-xs">
                        {index + 1}
                      </div>
                      <div className="md:col-span-3">
                        <Label className="md:hidden text-[10px] font-bold uppercase mb-1 block">Meter Entry</Label>
                        <Input 
                          type="number"
                          placeholder="0.00"
                          value={row.meter}
                          onChange={(e) => handleRowChange(row.id, e.target.value)}
                          className="h-9"
                          autoFocus={index === newRows.length - 1}
                        />
                      </div>
                      <div className="md:col-span-3 flex flex-col items-center justify-center border-x-0 md:border-x border-muted px-2">
                        <Label className="md:hidden text-[10px] font-bold uppercase mb-1 block">Total Finish</Label>
                        <p className={`font-bold text-sm ${rowTotal > taka.greyMeter ? 'text-red-500' : 'text-emerald-600'}`}>
                          {rowTotal.toFixed(2)}m
                        </p>
                      </div>
                      <div className="md:col-span-2 flex flex-col items-center justify-center">
                        <Label className="md:hidden text-[10px] font-bold uppercase mb-1 block">Pending</Label>
                        <p className="font-bold text-sm text-amber-600">
                          {rowPending.toFixed(2)}m
                        </p>
                      </div>
                      <div className="md:col-span-2 flex flex-col items-center justify-center">
                        <Label className="md:hidden text-[10px] font-bold uppercase mb-1 block">Status</Label>
                        {getStatusBadge(rowPending, rowTotal, taka.greyMeter)}
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveRow(row.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Plus className="rotate-45" size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Final Finish</p>
                <p className="text-xl font-mono font-bold text-emerald-600">{finalTotal.toFixed(2)}<span className="text-xs">m</span></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Final Pending</p>
                <p className="text-xl font-mono font-bold text-amber-600">{finalPending.toFixed(2)}<span className="text-xs">m</span></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Shortage</p>
                <p className="text-xl font-mono font-bold text-destructive">{shortMeter.toFixed(2)}<span className="text-xs">m</span></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Shortage %</p>
                <p className="text-xl font-mono font-bold text-primary">{shortagePercent.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          {finalTotal > taka.greyMeter && (
            <div className="flex items-center gap-3 text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/20">
              <AlertCircle size={20} />
              <div>
                <p className="font-bold text-xs uppercase">Meter Overflow!</p>
                <p className="text-[11px] opacity-80">Total finish ({finalTotal.toFixed(2)}m) exceeds Grey Meter ({taka.greyMeter}m).</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 md:p-6 border-t bg-muted/20 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Button variant="ghost" onClick={onClose} className="font-bold text-muted-foreground hover:bg-muted">Cancel</Button>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => handleSave(false)} 
              disabled={submitting || currentAddedTotal <= 0}
              variant="outline"
              className="font-bold border-2"
            >
              {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save TP
            </Button>
            <Button 
              onClick={() => handleSave(true)} 
              disabled={submitting || currentAddedTotal <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ListChecks className="h-4 w-4 mr-2" />}
              Save & Complete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FinishMeterEntryPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "search">("pending");
  const [lotNoInput, setLotNoInput] = useState("");
  const [lotData, setLotData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [finishMeters, setFinishMeters] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTaka, setSelectedTaka] = useState<any>(null);

  const pendingLots = useQuery(api.production.list, {});
  const saveFinishMeter = useMutation(api.production.saveFinishMeter);

  const handleSearch = useCallback(
    async (lotNo?: string) => {
      const trimmed = (lotNo || lotNoInput).trim();
      if (!trimmed) return;

      setIsSearching(true);
      setSearchError(null);
      setLotData(null);
      setFinishMeters({});
      setActiveTab("search");

      try {
        const data = await baseApi.get<any>(
          `/production/lot-by-no?lotNo=${encodeURIComponent(trimmed)}`,
        );
        if (!data || !data.lot) {
          setSearchError("Lot not found. Please check the Lot Number.");
          return;
        }
        setLotData(data);
      } catch (error: any) {
        const msg = error?.message || "Failed to fetch lot details";
        if (msg.includes("not found")) {
          setSearchError(
            "No matching Lot found. Ensure stamping is completed for this Lot.",
          );
        } else {
          setSearchError(msg);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [lotNoInput],
  );

  const calculateShortage = (grey: number, finish: number) => {
    const short = grey - finish;
    const percent = (short / grey) * 100;
    return { short, percent };
  };

  const getFinishMeterColor = (grey: number, finish: number) => {
    if (finish > grey) return "text-red-500 font-bold";
    const { percent } = calculateShortage(grey, finish);
    if (percent > 25) return "text-emerald-500 font-bold";
    return "";
  };

  const handleSave = async () => {
    if (!lotData?.lot?._id) return;

    const items = Object.entries(finishMeters)
      .filter(([_, value]) => value.trim() !== "" && !isNaN(Number(value)))
      .map(([key, value]) => {
        const parts = key.split("_");
        const takaIndex = parts.length > 1 ? Number(parts[0]) : undefined;
        const takaNo = parts.length > 1 ? parts.slice(1).join("_") : key;
        return {
          takaNo,
          takaIndex,
          finishMeter: Number(value),
        };
      });

    if (items.length === 0) {
      toast.error("Please enter finish meter for at least one Taka");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveFinishMeter({
        orderId: lotData.lot.orderId,
        items,
      });
      toast.success("Finish meters saved successfully");
      setLotNoInput("");
      setLotData(null);
      setFinishMeters({});
      setActiveTab("pending");
    } catch (error) {
      toast.error("Failed to save finish meters");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshLotData = () => {
    if (lotData?.lot?.lotNo) {
      handleSearch(lotData.lot.lotNo);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
            <Info className="text-primary" size={22} /> Finish Meter Entry
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-base">
            Track fabric measurements and shortages before dispatch.
            Double-click an input for partial TP entries.
          </p>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/50 border text-foreground">
            <TabsTrigger
              value="pending"
              className="gap-2 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ListChecks size={16} /> Pending Lots
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="gap-2 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Search size={16} /> Manual Search
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsContent value="pending" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingLots === undefined ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32 bg-muted/20" />
                </Card>
              ))
            ) : pendingLots.length === 0 ? (
              <div className="col-span-full py-20 border-2 border-dashed rounded-3xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40">
                  <ListChecks size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    No lots are currently pending finish meter entry.
                  </p>
                </div>
              </div>
            ) : (
              pendingLots.map((lot: any) => (
                <Card
                  key={lot._id}
                  className="hover:border-primary/40 transition-all cursor-pointer group"
                  onClick={() => handleSearch(lot.lotNo)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="text-primary font-bold"
                        >
                          {lot.lotNo}
                        </Badge>
                        <h3 className="font-bold text-lg leading-tight">
                          {lot.partyName}
                        </h3>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                        {lot.pendingCount} Takas
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-muted">
                      <p className="text-sm text-muted-foreground font-medium">
                        {lot.marka} | {lot.qualityName}
                      </p>
                      <ArrowRight
                        size={18}
                        className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-0 space-y-6">
          <Card className="shadow-sm border-primary/20">
            <CardContent className="pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex flex-col md:flex-row gap-4 items-end"
              >
                <div className="flex-1 space-y-2 w-full">
                  <Label
                    htmlFor="lotNo"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Search Lot (Manual or QR)
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lotNo"
                      placeholder="Enter Lot Number (e.g. 02/27, 1025/27)..."
                      className="pl-9 h-12 text-lg font-medium"
                      value={lotNoInput}
                      onChange={(e) => setLotNoInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                      title="Scan QR Code"
                    >
                      <QrCode size={22} />
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 font-bold gap-2"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Search size={18} />
                  )}
                  Find Lot
                </Button>
              </form>
            </CardContent>
          </Card>

          {!lotData && !isSearching && !searchError && (
            <div className="py-20 border-2 border-dashed rounded-3xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40">
                <Search size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">No Data Shown</h3>
                <p className="text-muted-foreground">
                  Search a Lot to view pending finish meter entries.
                </p>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-muted-foreground font-medium animate-pulse">
                Fetching Lot details...
              </p>
            </div>
          )}

          {searchError && !isSearching && (
            <div className="py-16 border-2 border-dashed border-destructive/30 rounded-3xl bg-destructive/5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-destructive">
                  No matching data found
                </h3>
                <p className="text-muted-foreground max-w-md">{searchError}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchError(null);
                  setLotNoInput("");
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {lotData && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-4 md:py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Party Marka
                    </p>
                    <p className="font-bold text-xl">{lotData.lot.marka}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Lot Number
                    </p>
                    <p className="font-bold text-xl text-primary">
                      {lotData.lot.lotNo}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Party Name
                    </p>
                    <p className="font-semibold text-lg">
                      {lotData.lot.partyName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Quality
                    </p>
                    <p className="font-semibold text-lg">
                      {lotData.lot.qualityName}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-card border rounded-2xl overflow-hidden shadow-md">
                <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <AlertCircle className="text-amber-500" size={20} />
                    Pending Takas ({lotData.takas.length})
                  </h3>
                  <Badge variant="secondary" className="font-bold px-3">
                    Action Required
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-[650px]">
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider">
                          Party Marka
                        </TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider">
                          Lot No
                        </TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-wider">
                          Taka No
                        </TableHead>
                        <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">
                          Grey Meter
                        </TableHead>
                        <TableHead className="text-center font-bold uppercase text-[10px] tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="w-40 font-bold uppercase text-[10px] tracking-wider">
                          Finish Meter
                        </TableHead>
                        <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">
                          Short Meter
                        </TableHead>
                        <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">
                          Shortage %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotData.takas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Save size={24} />
                              </div>
                              <p className="text-lg font-bold text-foreground">
                                Perfect!
                              </p>
                              <p className="text-muted-foreground">
                                No pending finish meter entries for this lot.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lotData.takas.map((taka: any) => {
                          const takaKey =
                            taka.takaIndex !== undefined
                              ? `${taka.takaIndex}_${taka.takaNo}`
                              : taka.takaNo;

                          const finishValue =
                            finishMeters[takaKey] !== undefined
                              ? Number(finishMeters[takaKey])
                              : taka.finishMeter || 0;

                          const { short, percent } =
                            finishValue > 0
                              ? calculateShortage(taka.greyMeter, finishValue)
                              : { short: 0, percent: 0 };

                          return (
                            <TableRow
                              key={takaKey}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <TableCell className="font-medium text-muted-foreground">
                                {lotData.lot.marka}
                              </TableCell>
                              <TableCell className="font-medium text-muted-foreground">
                                {lotData.lot.lotNo}
                              </TableCell>
                              <TableCell className="font-bold">
                                {taka.takaNo ||
                                  `Sr ${(taka.takaIndex ?? 0) + 1}`}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                {taka.greyMeter}
                              </TableCell>
                              <TableCell className="text-center">
                                {taka.tpStatus === "TP Pending" ? (
                                  <Badge
                                    className="bg-amber-500 hover:bg-amber-600"
                                    title="Double click finish meter to see details"
                                  >
                                    TP Pending
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className={`h-10 font-mono text-lg border-2 focus-visible:ring-primary ${getFinishMeterColor(taka.greyMeter, finishValue)}`}
                                  placeholder={
                                    taka.finishMeter > 0
                                      ? "Total: " + taka.finishMeter
                                      : "Enter meter..."
                                  }
                                  value={
                                    finishMeters[takaKey] !== undefined
                                      ? finishMeters[takaKey]
                                      : taka.finishMeter > 0
                                        ? taka.finishMeter
                                        : ""
                                  }
                                  onChange={(e) =>
                                    setFinishMeters({
                                      ...finishMeters,
                                      [takaKey]: e.target.value,
                                    })
                                  }
                                  onDoubleClick={() => setSelectedTaka(taka)}
                                  title="Double click to open TP History"
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-muted-foreground">
                                {finishValue > 0
                                  ? `${short.toFixed(2)}`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-black text-muted-foreground">
                                {finishValue > 0
                                  ? `${percent.toFixed(1)}%`
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="text-foreground"
                    onClick={() => {
                      setLotNoInput("");
                      setLotData(null);
                      setFinishMeters({});
                      setSearchError(null);
                      setActiveTab("pending");
                    }}
                  >
                    Back to List
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isSubmitting || lotData.takas.length === 0}
                    className="gap-2 font-bold px-8 shadow-lg shadow-primary/10"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <Save size={20} />
                    )}
                    Confirm & Save Entries
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TPEntryModal
        open={!!selectedTaka}
        onClose={() => setSelectedTaka(null)}
        lotData={lotData}
        taka={selectedTaka}
        onSuccess={() => {
          setSelectedTaka(null);
          refreshLotData();
        }}
      />
    </div>
  );
}
