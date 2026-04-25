"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  FileText,
  Package,
  Scan,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import OcrChallanReader from "./OcrChallanReader";
import { cn } from "@/lib/utils";

type TakaRow = {
  takaNo: string;
  marka: string;
  meter: string;
  weight: string;
};

type OrderForm = {
  orderDate: string;
  firmId: string;
  firmName: string;
  partyId: string;
  partyName: string;
  partyNotFound?: boolean;
  marka: string;
  challanNo: string;
  weaverChNo: string;
  weaverMarka: string;
  weaverChDate: string;
  weaverId: string;
  weaverName: string;
  qualityId: string;
  qualityName: string;
  totalTaka: string;
  totalMeter: string;
  shippingMode: "DirectMills" | "MarketTempo" | "ByLR";
  takaDetails: TakaRow[];
};

const emptyOrder = (): OrderForm => ({
  orderDate: new Date().toISOString().split("T")[0],
  firmId: "",
  firmName: "",
  partyId: "",
  partyName: "",
  marka: "",
  weaverId: "",
  weaverName: "",
  challanNo: "",
  weaverChNo: "",
  weaverMarka: "",
  weaverChDate: "",
  qualityId: "",
  qualityName: "",
  totalTaka: "",
  totalMeter: "",
  shippingMode: "DirectMills",
  takaDetails: [{ takaNo: "1", marka: "", meter: "", weight: "" }],
});

export function BatchOrderEntry() {
  const accounts = useQuery(api.accounts.list, {});
  const weavers = useQuery(api.weavers.list, {});
  const qualities = useQuery(api.qualities.list, {});
  const createBatch = useMutation(api.orders.createBatch);

  const [orders, setOrders] = useState<OrderForm[]>([emptyOrder()]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showOcr, setShowOcr] = useState(false);

  const mills = (accounts ?? []).filter((a) => a.roleType === "Mill" && a.isActive);
  const masterAccounts = (accounts ?? []).filter((a) => ["Master", "Customer", "Supplier"].includes(a.roleType) && a.isActive);

  // Field update helpers
  const updateField = (field: keyof OrderForm, value: any) => {
    setOrders((prev) =>
      prev.map((o, i) => (i === current ? { ...o, [field]: value } : o))
    );
  };

  const updateTaka = (takaIdx: number, field: keyof TakaRow, value: string) => {
    setOrders((prev) =>
      prev.map((o, i) => {
        if (i !== current) return o;
        const newTakas = o.takaDetails.map((t, ti) =>
          ti === takaIdx ? { ...t, [field]: value } : t
        );
        return { ...o, takaDetails: newTakas };
      })
    );
  };

  const addTakaRow = () => {
    setOrders((prev) =>
      prev.map((o, i) => {
        if (i !== current) return o;
        return {
          ...o,
          takaDetails: [
            ...o.takaDetails,
            { takaNo: String(o.takaDetails.length + 1), marka: "", meter: "", weight: "" },
          ],
        };
      })
    );
  };

  const removeTakaRow = (idx: number) => {
    setOrders((prev) =>
      prev.map((o, i) => {
        if (i !== current) return o;
        return {
          ...o,
          takaDetails: o.takaDetails.filter((_, ti) => ti !== idx),
        };
      })
    );
  };

  // Bulk-fill taka rows from count
  const handleTakaCountChange = (val: string) => {
    updateField("totalTaka", val);
    const n = parseInt(val);
    if (!isNaN(n) && n > 0 && n <= 500) {
      updateField(
        "takaDetails",
        Array.from({ length: n }, (_, i) => ({
          takaNo: String(i + 1),
          marka: "",
          meter: "",
          weight: "",
        }))
      );
    }
  };

  const goTo = (n: number) => {
    setCurrent(Math.max(0, Math.min(orders.length - 1, n)));
  };

  const addNew = () => {
    setOrders((prev) => [...prev, emptyOrder()]);
    setCurrent(orders.length);
  };

  const handleReset = () => {
    if (confirm("Reset all entry data?")) {
      setOrders([emptyOrder()]);
      setCurrent(0);
    }
  };

  const handleOcrFill = useCallback(
    (data: any) => {
      // Normalize data: if it has 'challans' array, use it
      const challans = Array.isArray(data) ? data : (data.challans || [data]);

      if (challans.length > 1) {
        // Multi-challan (Batch mode)
        const mapped = challans.map((c: any) => ({
          ...emptyOrder(),
          weaverChNo: (c.challanNo || c.challan_no || "").toString(),
          orderDate: c.date || c.orderDate || new Date().toISOString().split("T")[0],
          qualityName: c.qualityName || c.quality || "",
          totalMeter: (c.totalMeter || c.meter || "").toString(),
          totalTaka: (c.takaCount || c.taka || "").toString(),
          firmId: c.firmId || "",
          partyId: c.partyId || "",
          partyName: c.partyName || "",
          partyNotFound: c.partyNotFound || false,
          qualityId: c.qualityId || "",
          weaverId: c.weaverId || "",
          takaDetails: (c.takaRows || c.table || []).map((r: any) => ({
            takaNo: (r.takaNo || r.tn || "").toString(),
            marka: (r.marka || r.mka || "").toString(),
            meter: (r.meter || "").toString(),
            weight: (r.weight || "").toString(),
          })),
        }));
        setOrders(mapped);
        setCurrent(0);
        if (mapped.some(m => m.partyNotFound)) {
          toast.warning("Some parties not found in master — please review");
        }
      } else {
        // Single fill for current slide
        const result = challans[0];
        const o = orders[current];
        updateField("weaverChNo", (result.challanNo || result.challan_no || o.weaverChNo).toString());
        updateField("orderDate", result.date || result.orderDate || o.orderDate);
        updateField("qualityName", result.qualityName || result.quality || o.qualityName);
        updateField("totalMeter", (result.totalMeter || result.meter || o.totalMeter).toString());
        updateField("totalTaka", (result.totalTaka || result.takaCount || result.taka || o.totalTaka).toString());
        
        // Auto-link to created/found master IDs
        if (result.firmId) updateField("firmId", result.firmId);
        if (result.partyId) updateField("partyId", result.partyId);
        if (result.partyName) updateField("partyName", result.partyName);
        if (result.partyNotFound) {
          updateField("partyNotFound", true);
          toast.error(`${result.partyName} not found in master, create new`);
        }
        if (result.qualityId) updateField("qualityId", result.qualityId);
        if (result.weaverId) updateField("weaverId", result.weaverId);

        const takas = result.takaRows || result.table;
        if (takas) {
          updateField(
            "takaDetails",
            takas.map((r: any) => ({
              takaNo: (r.takaNo || r.tn || "").toString(),
              marka: (r.marka || r.mka || "").toString(),
              meter: (r.meter || "").toString(),
              weight: (r.weight || "").toString(),
            }))
          );
        }
      }
      setShowOcr(false);
      toast.success("OCR data loaded — please review each slide");
    },
    [orders, current]
  );

  const handleSubmit = async () => {
    // Validation
    const invalid = orders.find(o => !o.firmId || !o.qualityName || !o.totalMeter);
    if (invalid) {
      toast.error("Please fill required fields for all challans (Firm, Quality, Meter)");
      return;
    }

    setLoading(true);
    try {
      // Map to backend schema
      const payload = orders.map(o => ({
        ...o,
        firmName: mills.find(m => m._id === o.firmId)?.accountName || o.firmName,
        partyName: masterAccounts.find(m => m._id === o.partyId)?.accountName || o.partyName,
        totalTaka: Number(o.totalTaka),
        totalMeter: Number(o.totalMeter),
        takaDetails: o.takaDetails.map(t => ({
          ...t,
          meter: Number(t.meter),
          weight: t.weight ? Number(t.weight) : undefined
        }))
      }));

      await createBatch({ challans: payload });
      toast.success(`Successfully processed ${orders.length} orders & generated production lots!`);
      setOrders([emptyOrder()]);
      setCurrent(0);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit batch");
    } finally {
      setLoading(false);
    }
  };

  const form = orders[current] || emptyOrder();
  const sumMeters = form.takaDetails.reduce((s, r) => s + (parseFloat(r.meter) || 0), 0);
  const meterMismatch = form.totalMeter !== "" && Math.abs(sumMeters - parseFloat(form.totalMeter)) > 0.1;

  return (
    <div className="space-y-4 flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-card border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
           <div className="bg-primary/10 p-2 rounded-lg">
             <FileText className="text-primary" size={20} />
           </div>
           <div>
             <h2 className="text-lg font-bold">Inward Batch Entry</h2>
             <p className="text-xs text-muted-foreground">Review and submit multiple challans at once</p>
           </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowOcr(true)} className="cursor-pointer">
            <Scan size={14} className="mr-2" /> OCR Scan PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="cursor-pointer">
            <RotateCcw size={14} className="mr-2" /> Reset
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading} className="cursor-pointer shadow-md bg-primary hover:opacity-90">
            {loading ? <Loader2 className="mr-2 animate-spin" size={14} /> : <CheckCircle size={14} className="mr-2" />}
            Submit All ({orders.length})
          </Button>
        </div>
      </div>

      {showOcr && (
        <OcrChallanReader onFill={handleOcrFill} onClose={() => setShowOcr(false)} />
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* Left Column: Form Container */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 bg-card border rounded-xl overflow-hidden shadow-sm">
          
          {/* Slider Navigation */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/20 shrink-0">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8 cursor-pointer" onClick={() => goTo(current - 1)} disabled={current === 0}>
                <ChevronLeft size={16} />
              </Button>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-muted-foreground">Challan {current + 1} of {orders.length}</span>
                <span className="text-sm font-semibold truncate max-w-[150px]">
                  {form.qualityName || "Draft Entry"}
                </span>
              </div>
              <Button size="icon" variant="outline" className="h-8 w-8 cursor-pointer" onClick={() => goTo(current + 1)} disabled={current === orders.length - 1}>
                <ChevronRight size={16} />
              </Button>
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto px-2 max-w-[200px] sm:max-w-md no-scrollbar">
              {orders.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    "w-8 h-8 rounded-md text-xs font-bold cursor-pointer shrink-0 transition-all border",
                    i === current ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={addNew}
                className="w-8 h-8 rounded-md border border-dashed border-primary/40 text-primary hover:bg-primary/5 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title="Add Blank Challan"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Mill & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                       <FileText size={16} />
                       <h3 className="text-xs font-bold uppercase tracking-wider">Source Details</h3>
                    </div>
                     <div className="space-y-2">
                        <Label className="text-xs">Firm (Mill) *</Label>
                        <Select value={form.firmId} onValueChange={(v) => updateField("firmId", v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select mill..." /></SelectTrigger>
                          <SelectContent>
                            {mills.map((m) => (
                              <SelectItem key={m._id} value={m._id}>{m.accountName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className={cn("text-xs", form.partyNotFound && "text-destructive font-bold")}>
                          Party * {form.partyNotFound && "(NOT FOUND IN MASTER)"}
                        </Label>
                        <Select value={form.partyId} onValueChange={(v) => {
                          const p = masterAccounts.find(x => x._id === v);
                          updateField("partyId", v);
                          updateField("partyName", p?.accountName || "");
                          updateField("partyNotFound", false);
                        }}>
                          <SelectTrigger className={cn("h-9", form.partyNotFound && "border-destructive")}>
                            <SelectValue placeholder={form.partyNotFound ? `${form.partyName} (Not Found)` : "Select party..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {masterAccounts.map((m) => (
                              <SelectItem key={m._id} value={m._id}>{m.accountName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.partyNotFound && (
                          <p className="text-[10px] text-destructive italic">Not found in master — please create new or select existing</p>
                        )}
                     </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <Label className="text-xs">Challan No</Label>
                           <Input className="h-9 font-mono" value={form.challanNo} onChange={(e) => updateField("challanNo", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs">Weaver Challan No *</Label>
                           <Input className="h-9 font-mono" value={form.weaverChNo} onChange={(e) => updateField("weaverChNo", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs">Shipping Mode *</Label>
                           <Select value={form.shippingMode} onValueChange={(v: any) => updateField("shippingMode", v)}>
                             <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="DirectMills">Direct Mills</SelectItem>
                               <SelectItem value="MarketTempo">Market Tempo</SelectItem>
                               <SelectItem value="ByLR">By LR</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                      </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Order Date</Label>
                        <Input className="h-9" type="date" value={form.orderDate} onChange={(e) => updateField("orderDate", e.target.value)} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                       <Package size={16} />
                       <h3 className="text-xs font-bold uppercase tracking-wider">Fabric Specification</h3>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs">Quality Name *</Label>
                       <Select value={form.qualityId} onValueChange={(v) => {
                         const q = qualities?.find(x => x._id === v);
                         updateField("qualityId", v);
                         updateField("qualityName", q?.qualityName || "");
                       }}>
                         <SelectTrigger className="h-9"><SelectValue placeholder="Select quality..." /></SelectTrigger>
                         <SelectContent>
                           {(qualities ?? []).map((q) => (
                             <SelectItem key={q._id} value={q._id}>{q.qualityName}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-xs">Total Taka *</Label>
                          <Input className="h-9" type="number" value={form.totalTaka} onChange={(e) => handleTakaCountChange(e.target.value)} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-xs">Total Meter *</Label>
                          <div className="relative">
                            <Input className={cn("h-9", meterMismatch && "border-destructive")} type="number" value={form.totalMeter} onChange={(e) => updateField("totalMeter", e.target.value)} />
                            {meterMismatch && <AlertTriangle className="absolute right-2 top-2.5 text-destructive" size={14} />}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Extra Details (Legacy Screenshot style) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Marka</Label>
                    <Input className="h-8 text-xs font-mono" value={form.marka} onChange={(e) => updateField("marka", e.target.value)} />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Weaver Marka</Label>
                    <Input className="h-8 text-xs font-mono" value={form.weaverMarka} onChange={(e) => updateField("weaverMarka", e.target.value)} />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Weaver Ch Date</Label>
                    <Input className="h-8 text-xs" type="date" value={form.weaverChDate} onChange={(e) => updateField("weaverChDate", e.target.value)} />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Weaver Name</Label>
                    <Select value={form.weaverId} onValueChange={(v) => updateField("weaverId", v)}>
                       <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                       <SelectContent>
                         {(weavers ?? []).map(w => <SelectItem key={w._id} value={w._id}>{w.weaverName}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Taka Details Table (Independent Scroll) */}
        <div className="lg:col-span-5 xl:col-span-4 h-[400px] lg:h-full flex flex-col min-h-0 bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-3 border-b bg-muted/20 shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Taka Entry</h3>
            <Button size="sm" variant="secondary" className="h-7 text-xs px-3 cursor-pointer rounded-full font-semibold" onClick={addTakaRow}>
              <Plus size={12} className="mr-1" /> Add Row
            </Button>
          </div>
          
          <ScrollArea className="flex-1 bg-card">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 z-10 border-b backdrop-blur-sm">
                <tr>
                  <th className="text-center px-4 py-2.5 font-semibold text-xs tracking-wider text-muted-foreground uppercase w-16">TN</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Marka</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs tracking-wider text-muted-foreground uppercase">Meter</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {form.takaDetails.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-12 text-center text-muted-foreground italic">No takas added</td></tr>
                )}
                {form.takaDetails.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-2 text-center font-medium text-muted-foreground">{row.takaNo}</td>
                    <td className="px-4 py-2">
                      <Input
                        className="h-8 text-sm bg-transparent border-transparent hover:border-border focus:border-primary transition-colors px-2"
                        value={row.marka}
                        onChange={(e) => updateTaka(idx, "marka", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        className="h-8 text-sm bg-transparent border-transparent hover:border-border focus:border-primary transition-colors px-2"
                        value={row.meter}
                        onChange={(e) => updateTaka(idx, "meter", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-full opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeTakaRow(idx)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
          
          <div className="p-3 border-t bg-muted/10 shrink-0 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Sum</span>
              <span className={cn("text-sm font-bold", meterMismatch ? "text-destructive" : "text-primary")}>
                {sumMeters.toFixed(2)}m
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target</span>
              <span className="text-sm font-bold text-muted-foreground">{form.totalMeter || "0"}m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal ScrollArea for better layout control
function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-y-auto custom-scrollbar", className)}>
      {children}
    </div>
  );
}
