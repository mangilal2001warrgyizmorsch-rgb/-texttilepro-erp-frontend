"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  User,
  Scissors,
  Camera,
  QrCode,
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
  partyChNo: string;
  marka: string;
  weaverId: string;
  weaverName: string;
  weaverChNo: string;
  weaverMarka: string;
  qualityId: string;
  qualityName: string;
  width: string;
  weight: string;
  length: string;
  chadhti: string;
  totalTaka: string;
  totalMeter: string;
  jobRate: string;
  greyRate: string;
  shippingMode: "DirectMills" | "MarketTempo" | "ByLR";
  lrNo: string;
  lrDate: string;
  transporterName: string;
  gstin: string;
  address: string;
  vehicleNo: string;
  driverMobile: string;
  takaDetails: TakaRow[];
};

const emptyOrder = (): OrderForm => ({
  orderDate: new Date().toISOString().split("T")[0],
  firmId: "",
  firmName: "",
  partyId: "",
  partyName: "",
  partyChNo: "",
  marka: "",
  weaverId: "",
  weaverName: "",
  weaverChNo: "",
  weaverMarka: "",
  qualityId: "",
  qualityName: "",
  width: "",
  weight: "",
  length: "",
  chadhti: "",
  totalTaka: "",
  totalMeter: "",
  jobRate: "",
  greyRate: "",
  shippingMode: "DirectMills",
  lrNo: "",
  lrDate: "",
  transporterName: "",
  gstin: "",
  address: "",
  vehicleNo: "",
  driverMobile: "",
  takaDetails: [{ takaNo: "1", marka: "", meter: "", weight: "" }],
});

interface BatchOrderEntryProps {
  onSuccess?: () => void;
  initialOrder?: any;
}

export function BatchOrderEntry({ onSuccess, initialOrder }: BatchOrderEntryProps = {}) {
  const accounts = useQuery(api.accounts.list, {});
  const weavers = useQuery(api.weavers.list, {});
  const qualities = useQuery(api.qualities.list, {});
  const codeMaster = useQuery(api.codeMaster.list, {});
  const createBatch = useMutation(api.orders.createBatch);
  const updateOrder = useMutation(api.orders.update);

  const [orders, setOrders] = useState<OrderForm[]>(() => {
    if (initialOrder) {
      return [{
        ...emptyOrder(),
        orderDate: initialOrder.orderDate ? new Date(initialOrder.orderDate).toISOString().split('T')[0] : new Date().toISOString().split("T")[0],
        firmId: initialOrder.firmId || "",
        firmName: initialOrder.firmName || "",
        partyId: initialOrder.masterId || initialOrder.partyId || "",
        partyName: initialOrder.masterName || initialOrder.partyName || "",
        partyChNo: initialOrder.partyChNo || "",
        marka: initialOrder.marka || "",
        weaverId: initialOrder.weaverId || "",
        weaverName: initialOrder.weaverName || "",
        weaverChNo: initialOrder.weaverChNo || "",
        weaverMarka: initialOrder.weaverMarka || "",
        qualityId: initialOrder.qualityId || "",
        qualityName: initialOrder.qualityName || "",
        width: initialOrder.width?.toString() || "",
        weight: initialOrder.weight?.toString() || "",
        length: initialOrder.length?.toString() || "",
        chadhti: initialOrder.chadhti?.toString() || "",
        totalTaka: initialOrder.totalTaka?.toString() || "",
        totalMeter: initialOrder.totalMeter?.toString() || "",
        jobRate: initialOrder.jobRate?.toString() || "",
        greyRate: initialOrder.greyRate?.toString() || "",
        shippingMode: initialOrder.shippingMode || "DirectMills",
        lrNo: initialOrder.lrNo || "",
        lrDate: initialOrder.lrDate || "",
        transporterName: initialOrder.transporterName || "",
        gstin: initialOrder.gstin || "",
        address: initialOrder.address || "",
        vehicleNo: initialOrder.vehicleNo || "",
        driverMobile: initialOrder.driverMobile || "",
        takaDetails: initialOrder.takaDetails?.map((t: any, i: number) => ({
          takaNo: t.takaNo || String(i + 1),
          marka: t.marka || "",
          meter: t.meter?.toString() || "",
          weight: t.weight?.toString() || "",
        })) || [{ takaNo: "1", marka: "", meter: "", weight: "" }],
      }];
    }
    return [emptyOrder()];
  });
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [ocrAutoCamera, setOcrAutoCamera] = useState(false);

  const mills = (accounts ?? []).filter((a) => a.roleType === "Mill" && a.isActive);
  const masterAccounts = (accounts ?? []).filter((a) => ["Master", "Customer", "Supplier"].includes(a.roleType) && a.isActive);

  const updateField = (field: keyof OrderForm, value: any) => {
    setOrders((prev) =>
      prev.map((o, i) => (i === current ? { ...o, [field]: value } : o))
    );
  };

  const updateOrderObject = (updates: Partial<OrderForm>) => {
    setOrders((prev) =>
      prev.map((o, i) => (i === current ? { ...o, ...updates } : o))
    );
  };

  const currentForm = orders[current] || emptyOrder();

  // Track previous IDs to only auto-fill on change
  const [lastPartyId, setLastPartyId] = useState<string | null>(null);
  const [lastWeaverId, setLastWeaverId] = useState<string | null>(null);

  // Auto-fetch Marka based on Party selection (from Account Master)
  useEffect(() => {
    if (currentForm.partyId && currentForm.partyId !== lastPartyId && masterAccounts) {
      const p = masterAccounts.find(x => x._id === currentForm.partyId);
      const targetMarka = p?.clientCode || p?.marka || "";
      if (targetMarka) {
        updateOrderObject({ marka: targetMarka });
      }
      setLastPartyId(currentForm.partyId);
    }
  }, [currentForm.partyId, masterAccounts, lastPartyId]);

  // Auto-fetch Weaver Marka based on Weaver selection (from Weaver Master)
  useEffect(() => {
    if (currentForm.weaverId && currentForm.weaverId !== lastWeaverId && weavers) {
      const w = weavers.find(x => x._id === currentForm.weaverId);
      const targetMarka = w?.weaverCode || w?.marka || w?.weaverMarka || "";
      if (targetMarka) {
        updateOrderObject({ weaverMarka: targetMarka });
      }
      setLastWeaverId(currentForm.weaverId);
    }
  }, [currentForm.weaverId, weavers, lastWeaverId]);

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

  const handleTakaCountChange = (val: string) => {
    const n = parseInt(val);
    const updates: Partial<OrderForm> = { totalTaka: val };
    if (!isNaN(n) && n > 0 && n <= 500) {
      updates.takaDetails = Array.from({ length: n }, (_, i) => ({
        takaNo: String(i + 1),
        marka: "",
        meter: "",
        weight: "",
      }));
    }
    updateOrderObject(updates);
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
      const challans = Array.isArray(data) ? data : (data.challans || [data]);
      if (challans.length > 1) {
        const mapped = challans.map((c: any) => {
          const qId = qualities?.find(q => q.qualityName?.toLowerCase() === c.qualityName?.toLowerCase() || q.qualityName?.toLowerCase() === c.quality?.toLowerCase())?._id || "";
          const wId = weavers?.find(w => w.weaverName?.toLowerCase() === c.weaverName?.toLowerCase() || w.weaverName?.toLowerCase() === c.weaver?.toLowerCase())?._id || "";
          return {
            ...emptyOrder(),
            orderDate: c.date || c.orderDate || new Date().toISOString().split("T")[0],
            firmId: c.firmId || "",
            partyId: c.partyId || "",
            partyName: c.partyName || "",
            partyChNo: c.partyChNo || c.challanNo || c.challan_no || "",
            marka: c.marka || c.mka || "",
            weaverId: wId || c.weaverId || "",
            weaverName: c.weaverName || c.weaver || "",
            weaverChNo: c.weaverChNo || c.weaver_challan_no || "",
            weaverMarka: c.weaverMarka || c.weaver_marka || "",
            qualityId: qId || c.qualityId || "",
            qualityName: c.qualityName || c.quality || "",
            width: (c.width || "").toString(),
            weight: (c.weight || "").toString(),
            length: (c.length || "").toString(),
            chadhti: (c.chadhti || c.chadti || "").toString(),
            totalTaka: (c.totalTaka || c.takaCount || c.taka || "").toString(),
            totalMeter: (c.totalMeter || c.meter || "").toString(),
            lrNo: c.lrNo || c.lr_no || "",
            lrDate: c.lrDate || c.lr_date || "",
            transporterName: c.transporterName || c.transporter || "",
            gstin: c.gstin || c.gstin_no || "",
            address: c.address || c.party_address || "",
            takaDetails: (c.takaRows || c.table || []).map((r: any) => ({
              takaNo: (r.takaNo || r.tn || "").toString(),
              marka: (r.marka || r.mka || "").toString(),
              meter: (r.meter || "").toString(),
              weight: (r.weight || "").toString(),
            })),
          };
        });
        setOrders(mapped);
        setCurrent(0);
      } else {
        const result = challans[0];
        const f = mills.find(m => m.accountName?.toLowerCase() === result.firmName?.toLowerCase() || m.accountName?.toLowerCase() === result.firm?.toLowerCase() || m.accountName?.toLowerCase() === result.partyName?.toLowerCase());
        const qId = qualities?.find(q => q.qualityName?.toLowerCase() === result.qualityName?.toLowerCase() || q.qualityName?.toLowerCase() === result.quality?.toLowerCase())?._id || "";
        const wId = weavers?.find(w => w.weaverName?.toLowerCase() === result.weaverName?.toLowerCase() || w.weaverName?.toLowerCase() === result.weaver?.toLowerCase())?._id || "";
        
        updateOrderObject({
          orderDate: result.date || result.orderDate || orders[current].orderDate,
          firmId: f?._id || result.firmId || orders[current].firmId,
          firmName: f?.accountName || result.firmName || result.firm || result.partyName || orders[current].firmName,
          partyId: result.partyId || orders[current].partyId,
          partyName: result.partyName || orders[current].partyName,
          partyChNo: result.partyChNo || result.challanNo || result.challan_no || orders[current].partyChNo,
          marka: result.marka || result.mka || orders[current].marka,
          qualityId: qId || result.qualityId || orders[current].qualityId,
          qualityName: f?.accountName === (result.qualityName || result.quality) ? "" : (result.qualityName || result.quality || orders[current].qualityName),
          weaverId: wId || result.weaverId || orders[current].weaverId,
          weaverName: result.weaverName || result.weaver || orders[current].weaverName,
          weaverChNo: result.weaverChNo || result.weaver_challan_no || orders[current].weaverChNo,
          weaverMarka: result.weaverMarka || result.weaver_marka || orders[current].weaverMarka,
          totalTaka: (result.totalTaka || result.takaCount || result.taka || orders[current].totalTaka).toString(),
          totalMeter: (result.totalMeter || result.meter || orders[current].totalMeter).toString(),
          width: (result.width || orders[current].width).toString(),
          chadhti: (result.chadhti || result.chadti || orders[current].chadhti).toString(),
          lrNo: result.lrNo || result.lr_no || orders[current].lrNo,
          lrDate: result.lrDate || result.lr_date || orders[current].lrDate,
          transporterName: result.transporterName || result.transporter || orders[current].transporterName,
          gstin: result.gstin || result.gstin_no || orders[current].gstin,
          address: result.address || result.party_address || orders[current].address,
          takaDetails: result.takaRows || result.table ? (result.takaRows || result.table).map((r: any) => ({
            takaNo: (r.takaNo || r.tn || "").toString(),
            marka: (r.marka || r.mka || "").toString(),
            meter: (r.meter || "").toString(),
            weight: (r.weight || "").toString(),
          })) : orders[current].takaDetails
        });
      }
      toast.success("OCR data loaded!");
    },
    [orders, current, qualities, weavers]
  );

  const handleSubmit = async () => {
    const invalid = orders.find(o => !o.firmId || !o.qualityName || !o.totalMeter);
    if (invalid) {
      toast.error("Please fill required fields (Firm, Quality, Meter)");
      return;
    }
    setLoading(true);
    try {
      const payload = orders.map(o => ({
        ...o,
        totalTaka: Number(o.totalTaka),
        totalMeter: Number(o.totalMeter),
        width: Number(o.width) || 0,
        weight: Number(o.weight) || 0,
        length: Number(o.length) || 0,
        chadhti: Number(o.chadhti) || 0,
        jobRate: Number(o.jobRate) || 0,
        greyRate: Number(o.greyRate) || 0,
        takaDetails: o.takaDetails.map(t => ({
          ...t,
          meter: Number(t.meter),
          weight: Number(t.weight) || 0
        }))
      }));
      if (initialOrder) {
        await updateOrder({ id: initialOrder._id, ...payload[0] });
        toast.success("Order updated!");
      } else {
        await createBatch({ challans: payload });
        toast.success(`Successfully submitted ${orders.length} orders!`);
      }
      if (onSuccess) onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const form = orders[current] || emptyOrder();
  const sumMeters = form.takaDetails.reduce((s, r) => s + (parseFloat(r.meter) || 0), 0);
  const meterMismatch = form.totalMeter !== "" && Math.abs(sumMeters - parseFloat(form.totalMeter)) > 0.1;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-4 rounded-xl shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
           <div className="bg-primary/10 p-2 rounded-lg">
             <FileText className="text-primary" size={20} />
           </div>
            <div>
              <h2 className="text-lg font-bold">{initialOrder ? "Edit Order Detail" : "Inward Batch Entry"}</h2>
              <p className="text-xs text-muted-foreground">Review and submit multiple challans at once</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!initialOrder && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowOcr(true)} className="cursor-pointer">
                <Scan size={14} className="mr-2" /> OCR Scan PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="cursor-pointer">
                <RotateCcw size={14} className="mr-2" /> Reset
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={loading} className="cursor-pointer shadow-md bg-green-600 hover:bg-green-700 text-white font-bold">
            {loading ? <Loader2 className="mr-2 animate-spin" size={14} /> : <CheckCircle size={14} className="mr-2" />}
            {initialOrder ? "Update Order" : `Submit All (${orders.length})`}
          </Button>
        </div>
      </div>

      {!initialOrder && showOcr && (
        <OcrChallanReader 
          onFill={(res) => { handleOcrFill(res); }} 
          onClose={() => setShowOcr(false)} 
        />
      )}

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Section: Form Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Slider Navigation */}
          {!initialOrder && (
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="outline" onClick={() => goTo(current - 1)} disabled={current === 0}><ChevronLeft size={20} /></Button>
                  <div className="text-center"><span className="text-[10px] font-bold uppercase text-muted-foreground block">Challan</span><span className="text-lg font-bold">{current + 1} of {orders.length}</span></div>
                  <Button size="icon" variant="outline" onClick={() => goTo(current + 1)} disabled={current === orders.length - 1}><ChevronRight size={20} /></Button>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[400px] no-scrollbar">
                  {orders.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)} className={cn("w-9 h-9 rounded-lg text-xs font-bold border transition-all shrink-0", i === current ? "bg-primary text-white scale-110 shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{i + 1}</button>
                  ))}
                  <button onClick={addNew} className="w-9 h-9 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 flex items-center justify-center transition-colors shrink-0"><Plus size={18} /></button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10"><CardTitle className="text-sm font-bold flex items-center gap-2"><FileText size={16} className="text-primary" /> Basic Details</CardTitle></CardHeader>
            <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Date *</Label><Input type="date" value={form.orderDate} onChange={(e) => updateField("orderDate", e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Firm Name (Mill) *</Label>
                <Select value={form.firmId} onValueChange={(v) => { const m = mills.find(x => x._id === v); updateOrderObject({ firmId: v, firmName: m?.accountName || "" }); }}>
                  <SelectTrigger><SelectValue placeholder="Select mill..." /></SelectTrigger>
                  <SelectContent>{mills.map((m) => <SelectItem key={m._id} value={m._id}>{m.accountName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Party Name</Label>
                <Select value={form.partyId} onValueChange={(v) => { const p = masterAccounts.find(x => x._id === v); updateOrderObject({ partyId: v, partyName: p?.accountName || "" }); }}>
                  <SelectTrigger><SelectValue placeholder="Select party..." /></SelectTrigger>
                  <SelectContent>{masterAccounts.map((m) => <SelectItem key={m._id} value={m._id}>{m.accountName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Marka</Label><Input value={form.marka} onChange={(e) => updateField("marka", e.target.value)} placeholder="Enter marka" /></div>

              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Challan No</Label><Input value={form.partyChNo} onChange={(e) => updateField("partyChNo", e.target.value)} placeholder="Enter challan no" /></div>
            </CardContent>
          </Card>

          {/* Weaver Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10"><CardTitle className="text-sm font-bold flex items-center gap-2"><User size={16} className="text-primary" /> Weaver Details</CardTitle></CardHeader>
            <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Weaver Name</Label>
                <Select value={form.weaverId} onValueChange={(v) => { const w = weavers?.find(x => x._id === v); updateOrderObject({ weaverId: v, weaverName: w?.weaverName || "" }); }}>
                  <SelectTrigger><SelectValue placeholder="Select weaver..." /></SelectTrigger>
                  <SelectContent>{weavers?.map((w) => <SelectItem key={w._id} value={w._id}>{w.weaverName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Weaver Ch No</Label><Input value={form.weaverChNo} onChange={(e) => updateField("weaverChNo", e.target.value)} placeholder="Enter weaver challan no" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Weaver Marka</Label><Input value={form.weaverMarka} onChange={(e) => updateField("weaverMarka", e.target.value)} placeholder="Enter weaver marka" /></div>
            </CardContent>
          </Card>

          {/* Fabric Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10"><CardTitle className="text-sm font-bold flex items-center gap-2"><Package size={16} className="text-primary" /> Fabric Details</CardTitle></CardHeader>
            <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Quality Name *</Label>
                <Select value={form.qualityId} onValueChange={(v) => { const q = qualities?.find(x => x._id === v); updateOrderObject({ qualityId: v, qualityName: q?.qualityName || "" }); }}>
                  <SelectTrigger><SelectValue placeholder="Select quality..." /></SelectTrigger>
                  <SelectContent>{qualities?.map((q) => <SelectItem key={q._id} value={q._id}>{q.qualityName}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={form.qualityName} onChange={(e) => updateField("qualityName", e.target.value)} placeholder="Or type manually" className="mt-2" />
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Width (inches)</Label><Input value={form.width} onChange={(e) => updateField("width", e.target.value)} placeholder="44" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Weight (kg)</Label><Input value={form.weight} onChange={(e) => updateField("weight", e.target.value)} placeholder="0" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Length</Label><Input value={form.length} onChange={(e) => updateField("length", e.target.value)} placeholder="0" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Chadti</Label><Input value={form.chadhti} onChange={(e) => updateField("chadhti", e.target.value)} placeholder="0" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Total Taka *</Label><Input type="number" value={form.totalTaka} onChange={(e) => handleTakaCountChange(e.target.value)} placeholder="20" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Total Meter *</Label><div className="relative"><Input className={cn(meterMismatch && "border-destructive")} value={form.totalMeter} onChange={(e) => updateField("totalMeter", e.target.value)} placeholder="2000" />{meterMismatch && <AlertTriangle className="absolute right-3 top-2.5 text-destructive" size={18} />}</div></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Job Rate</Label><Input value={form.jobRate} onChange={(e) => updateField("jobRate", e.target.value)} placeholder="5.00" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Grey Rate</Label><Input value={form.greyRate} onChange={(e) => updateField("greyRate", e.target.value)} placeholder="45.00" /></div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Taka Details */}
        <div className="lg:col-span-4 sticky top-[80px]">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><Scissors size={16} className="text-primary" /> Taka Details</CardTitle>
              <Button size="sm" variant="outline" onClick={addTakaRow} className="h-7 text-[10px] uppercase font-bold"><Plus size={12} className="mr-1" /> Add Row</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0 z-10 border-b">
                    <tr>
                      <th className="px-3 py-2 text-center w-12 font-bold uppercase text-[9px] text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left font-bold uppercase text-[9px] text-muted-foreground">Taka No</th>
                      <th className="px-3 py-2 text-left font-bold uppercase text-[9px] text-muted-foreground">Meter</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {form.takaDetails.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 group">
                        <td className="px-3 py-2 text-center text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="px-3 py-2"><Input className="h-7 text-xs font-mono bg-transparent border-none focus:ring-1" value={row.takaNo} onChange={(e) => updateTaka(idx, "takaNo", e.target.value)} /></td>
                        <td className="px-3 py-2"><Input className="h-7 text-xs font-mono bg-transparent border-none focus:ring-1" value={row.meter} onChange={(e) => updateTaka(idx, "meter", e.target.value)} /></td>
                        <td className="px-2 py-2 text-center"><Button size="icon" variant="ghost" onClick={() => removeTakaRow(idx)} className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t bg-muted/5 flex items-center justify-between">
                <div className="flex flex-col"><span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Current Sum</span><span className={cn("text-lg font-bold leading-none", meterMismatch ? "text-destructive" : "text-primary")}>{sumMeters.toFixed(2)}m</span></div>
                <div className="flex flex-col items-end"><span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Target Total</span><span className="text-lg font-bold text-muted-foreground leading-none">{form.totalMeter || "0"}m</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
