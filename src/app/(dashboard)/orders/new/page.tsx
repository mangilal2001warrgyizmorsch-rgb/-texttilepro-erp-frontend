"use client";

import { useState, useCallback } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Truck,
  FileText,
  Package,
  Loader2,
  Upload,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import OcrChallanReader from "../_components/OcrChallanReader";

type ShippingMode = "DirectMills" | "MarketTempo" | "ByLR";

type TakaRow = {
  takaNo: string;
  meter: string;
  weight: string;
};

type FormState = {
  orderDate: string;
  firmId: string;
  masterId: string;
  marka: string;
  weaverId: string;
  weaverChNo: string;
  weaverMarka: string;
  weaverChDate: string;
  qualityId: string;
  qualityName: string;
  weight: string;
  length: string;
  width: string;
  chadti: string;
  totalTaka: string;
  totalMeter: string;
  jobRate: string;
  greyRate: string;
  shippingMode: ShippingMode;
  vehicleNo: string;
  driverMobile: string;
  transportName: string;
  lrNo: string;
  lrDate: string;
  noBales: string;
  baleNo: string;
  chequeAmount: string;
  receiverName: string;
  receiverMobile: string;
};

const defaultForm: FormState = {
  orderDate: new Date().toISOString().split("T")[0],
  firmId: "",
  masterId: "",
  marka: "",
  weaverId: "",
  weaverChNo: "",
  weaverMarka: "",
  weaverChDate: "",
  qualityId: "",
  qualityName: "",
  weight: "",
  length: "",
  width: "",
  chadti: "",
  totalTaka: "",
  totalMeter: "",
  jobRate: "",
  greyRate: "",
  shippingMode: "DirectMills",
  vehicleNo: "",
  driverMobile: "",
  transportName: "",
  lrNo: "",
  lrDate: "",
  noBales: "",
  baleNo: "",
  chequeAmount: "",
  receiverName: "",
  receiverMobile: "",
};

export default function NewOrderPage() {
  const router = useRouter();
  const accounts = useQuery(api.accounts.list, {});
  const weavers = useQuery(api.weavers.list, {});
  const qualities = useQuery(api.qualities.list, {});
  const codeMasters = useQuery(api.codeMaster.list, {});
  const createOrder = useMutation(api.orders.create);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [takaRows, setTakaRows] = useState<TakaRow[]>([
    { takaNo: "1", meter: "", weight: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [lrFileStorageId, setLrFileStorageId] = useState<string | null>(null);

  const mills = (accounts ?? []).filter((a) => a.roleType === "Mill" && a.isActive);
  const masters = (accounts ?? []).filter((a) => a.roleType === "Master" && a.isActive);

  const set = (k: keyof FormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleFirmChange = (firmId: string) => {
    const firm = mills.find((m) => m._id === firmId);
    if (!firm) return;
    set("firmId", firmId);
    // Auto-find marka from code master
    const code = (codeMasters ?? []).find((c) => c.accountId === firmId);
    if (code) set("marka", code.clientCode);
  };

  const handleQualityChange = (qualityId: string) => {
    const q = (qualities ?? []).find((x) => x._id === qualityId);
    if (!q) return;
    setForm((p) => ({
      ...p,
      qualityId,
      qualityName: q.qualityName,
      jobRate: q.defaultJobRate?.toString() ?? p.jobRate,
      greyRate: q.greyRate?.toString() ?? p.greyRate,
    }));
  };

  const handleWeaverChange = (weaverId: string) => {
    const w = (weavers ?? []).find((x) => x._id === weaverId);
    if (!w) return;
    setForm((p) => ({ ...p, weaverId, weaverMarka: w.weaverCode }));
  };

  // Sum meters from taka rows
  const sumMeters = takaRows.reduce((s, r) => s + (parseFloat(r.meter) || 0), 0);
  const meterMismatch =
    form.totalMeter !== "" && Math.abs(sumMeters - parseFloat(form.totalMeter)) > 0.01;

  const updateTaka = (i: number, k: keyof TakaRow, v: string) => {
    setTakaRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  };

  const addTakaRow = () => {
    setTakaRows((prev) => [
      ...prev,
      { takaNo: String(prev.length + 1), meter: "", weight: "" },
    ]);
  };

  const removeTakaRow = (i: number) => {
    setTakaRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Bulk-fill taka rows from count
  const handleTakaCountChange = (val: string) => {
    set("totalTaka", val);
    const n = parseInt(val);
    if (!isNaN(n) && n > 0 && n <= 500) {
      setTakaRows(
        Array.from({ length: n }, (_, i) => ({
          takaNo: String(i + 1),
          meter: "",
          weight: "",
        }))
      );
    }
  };

  // OCR auto-fill callback
  const handleOcrFill = useCallback(
    (data: {
      partyName?: string;
      challanNo?: string;
      date?: string;
      weaverName?: string;
      weaverChallanNo?: string;
      weaverMarka?: string;
      chDate?: string;
      qualityName?: string;
      totalMeter?: number;
      takaCount?: number;
      takaRows?: { takaNo: string; meter: number; weight?: number }[];
    }) => {
      setForm((p) => ({
        ...p,
        weaverChNo: data.challanNo ?? p.weaverChNo,
        orderDate: data.date ?? p.orderDate,
        weaverMarka: data.weaverMarka ?? p.weaverMarka,
        weaverChDate: data.chDate ?? p.weaverChDate,
        qualityName: data.qualityName ?? p.qualityName,
        totalMeter: data.totalMeter?.toString() ?? p.totalMeter,
        totalTaka: data.takaCount?.toString() ?? p.totalTaka,
      }));

      // Try to match weaver
      if (data.weaverName) {
        const matched = (weavers ?? []).find((w) =>
          w.weaverName.toLowerCase().includes(data.weaverName!.toLowerCase())
        );
        if (matched) {
          setForm((p) => ({ ...p, weaverId: matched._id, weaverMarka: matched.weaverCode }));
        }
      }

      // Try to match quality
      if (data.qualityName) {
        const matchedQ = (qualities ?? []).find((q) =>
          q.qualityName.toLowerCase().includes(data.qualityName!.toLowerCase())
        );
        if (matchedQ) {
          handleQualityChange(matchedQ._id);
        }
      }

      // Fill taka rows
      if (data.takaRows && data.takaRows.length > 0) {
        setTakaRows(
          data.takaRows.map((r) => ({
            takaNo: r.takaNo,
            meter: r.meter.toString(),
            weight: r.weight?.toString() ?? "",
          }))
        );
      } else if (data.takaCount) {
        handleTakaCountChange(data.takaCount.toString());
      }

      setShowOcr(false);
      toast.success("Challan data auto-filled — please review and confirm");
    },
    [weavers, qualities]
  );

  const handleSave = async () => {
    if (!form.firmId) { toast.error("Select a Firm (Mill)"); return; }
    if (!form.qualityName) { toast.error("Quality is required"); return; }
    if (!form.totalTaka || !form.totalMeter) { toast.error("Total Taka and Total Meter are required"); return; }
    if (meterMismatch) { toast.error(`Meter mismatch: taka sum (${sumMeters.toFixed(2)}) ≠ total (${form.totalMeter})`); return; }

    const filledTakas = takaRows.filter((r) => r.takaNo && r.meter);
    if (filledTakas.length === 0) { toast.error("Enter at least one taka detail"); return; }

    setSaving(true);
    try {
      await createOrder({
        orderDate: form.orderDate,
        firmId: form.firmId as string,
        firmName: mills.find((m) => m._id === form.firmId)?.accountName ?? "",
        masterId: form.masterId ? (form.masterId as string) : undefined,
        masterName: masters.find((m) => m._id === form.masterId)?.accountName,
        marka: form.marka,
        weaverId: form.weaverId ? (form.weaverId as string) : undefined,
        weaverName: (weavers ?? []).find((w) => w._id === form.weaverId)?.weaverName,
        weaverChNo: form.weaverChNo || undefined,
        weaverMarka: form.weaverMarka || undefined,
        weaverChDate: form.weaverChDate || undefined,
        qualityId: form.qualityId ? (form.qualityId as string) : undefined,
        qualityName: form.qualityName,
        weight: form.weight ? Number(form.weight) : undefined,
        length: form.length ? Number(form.length) : undefined,
        width: form.width ? Number(form.width) : undefined,
        chadti: form.chadti ? Number(form.chadti) : undefined,
        totalTaka: Number(form.totalTaka),
        totalMeter: Number(form.totalMeter),
        jobRate: form.jobRate ? Number(form.jobRate) : undefined,
        greyRate: form.greyRate ? Number(form.greyRate) : undefined,
        shippingMode: form.shippingMode,
        vehicleNo: form.vehicleNo || undefined,
        driverMobile: form.driverMobile || undefined,
        transportName: form.transportName || undefined,
        lrNo: form.lrNo || undefined,
        lrDate: form.lrDate || undefined,
        noBales: form.noBales ? Number(form.noBales) : undefined,
        baleNo: form.baleNo || undefined,
        chequeAmount: form.chequeAmount ? Number(form.chequeAmount) : undefined,
        receiverName: form.receiverName || undefined,
        receiverMobile: form.receiverMobile || undefined,
        takaDetails: filledTakas.map((r) => ({
          takaNo: r.takaNo,
          meter: Number(r.meter),
          weight: r.weight ? Number(r.weight) : undefined,
          isStamped: false,
          stampedAt: undefined,
        })),
        lrFileStorageId: lrFileStorageId ?? undefined,
      });
      toast.success("Order created — Status: Pending for Challan");
      router.push("/orders");
    } catch {
      toast.error("Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/orders")} className="cursor-pointer">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">New Order Entry</h1>
          <p className="text-sm text-muted-foreground">Grey fabric order from mill</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowOcr(true)}
          className="cursor-pointer gap-2"
        >
          <Scan size={16} />
          OCR Challan Reader
        </Button>
      </div>

      {showOcr && (
        <OcrChallanReader onFill={handleOcrFill} onClose={() => setShowOcr(false)} />
      )}

      {/* Section 1: Basic */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} /> Basic Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.orderDate} onChange={(e) => set("orderDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Firm Name (Mill) *</Label>
            <Select value={form.firmId} onValueChange={handleFirmChange}>
              <SelectTrigger><SelectValue placeholder="Select mill..." /></SelectTrigger>
              <SelectContent>
                {mills.map((m) => (
                  <SelectItem key={m._id} value={m._id}>{m.accountName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Master Name (Broker)</Label>
            <Select value={form.masterId} onValueChange={(v) => set("masterId", v)}>
              <SelectTrigger><SelectValue placeholder="Select master..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {masters.map((m) => (
                  <SelectItem key={m._id} value={m._id}>{m.accountName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Marka</Label>
            <Input
              placeholder="Auto-filled from Code Master"
              value={form.marka}
              onChange={(e) => set("marka", e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Weaver */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={16} /> Weaver Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Weaver Name</Label>
            <Select value={form.weaverId} onValueChange={handleWeaverChange}>
              <SelectTrigger><SelectValue placeholder="Select weaver..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {(weavers ?? []).map((w) => (
                  <SelectItem key={w._id} value={w._id}>{w.weaverName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Weaver Ch No</Label>
            <Input placeholder="Challan number" value={form.weaverChNo} onChange={(e) => set("weaverChNo", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Weaver Marka</Label>
            <Input placeholder="Weaver's own marka code" value={form.weaverMarka} onChange={(e) => set("weaverMarka", e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Weaver CH Date</Label>
            <Input type="date" value={form.weaverChDate} onChange={(e) => set("weaverChDate", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Fabric */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={16} /> Fabric Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Quality Name *</Label>
            <Select value={form.qualityId} onValueChange={handleQualityChange}>
              <SelectTrigger><SelectValue placeholder="Select quality..." /></SelectTrigger>
              <SelectContent>
                {(qualities ?? []).map((q) => (
                  <SelectItem key={q._id} value={q._id}>{q.qualityName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!form.qualityId && (
              <Input
                placeholder="Or type quality name manually"
                value={form.qualityName}
                onChange={(e) => set("qualityName", e.target.value)}
                className="mt-1"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Width (inches)</Label>
            <Input type="number" placeholder="44" value={form.width} onChange={(e) => set("width", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" placeholder="0" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Length</Label>
            <Input type="number" placeholder="0" value={form.length} onChange={(e) => set("length", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Chadti</Label>
            <Input type="number" placeholder="0" value={form.chadti} onChange={(e) => set("chadti", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Total Taka *</Label>
            <Input
              type="number"
              placeholder="e.g. 20"
              value={form.totalTaka}
              onChange={(e) => handleTakaCountChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total Meter *</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="e.g. 2000"
                value={form.totalMeter}
                onChange={(e) => set("totalMeter", e.target.value)}
                className={meterMismatch ? "border-destructive" : ""}
              />
              {form.totalMeter && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Sum: {sumMeters.toFixed(2)}
                </span>
              )}
            </div>
            {meterMismatch && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle size={11} /> Taka sum ({sumMeters.toFixed(2)}) ≠ total ({form.totalMeter})
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Job Rate (₹/mtr)</Label>
            <Input type="number" placeholder="5.00" value={form.jobRate} onChange={(e) => set("jobRate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Grey Rate (₹/mtr)</Label>
            <Input type="number" placeholder="45.00" value={form.greyRate} onChange={(e) => set("greyRate", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Taka Details Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Taka Details</CardTitle>
            <div className="flex items-center gap-2">
              {!meterMismatch && sumMeters > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 size={13} /> {sumMeters.toFixed(2)} m
                </span>
              )}
              <Button size="sm" variant="secondary" onClick={addTakaRow} className="cursor-pointer">
                <Plus size={14} className="mr-1" /> Add Row
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground w-16">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Taka No</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Meter</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Weight (kg)</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {takaRows.map((row, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-1.5 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <Input
                        className="h-8 text-sm font-mono"
                        value={row.takaNo}
                        onChange={(e) => updateTaka(i, "takaNo", e.target.value)}
                        placeholder="T001"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        value={row.meter}
                        onChange={(e) => updateTaka(i, "meter", e.target.value)}
                        placeholder="100.00"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        value={row.weight}
                        onChange={(e) => updateTaka(i, "weight", e.target.value)}
                        placeholder="5.00"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() => removeTakaRow(i)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {takaRows.length > 0 && (
                <tfoot className="bg-muted/30">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                      TOTAL ({takaRows.filter((r) => r.meter).length} takas)
                    </td>
                    <td className="px-4 py-2 text-sm font-bold">{sumMeters.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Shipping */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck size={16} /> Mode of Shipping *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2 flex-wrap">
            {(["DirectMills", "MarketTempo", "ByLR"] as ShippingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => set("shippingMode", mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors border ${
                  form.shippingMode === mode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {mode === "DirectMills" ? "Direct Mills" : mode === "MarketTempo" ? "Market Tempo" : "By LR"}
              </button>
            ))}
          </div>

          {/* Direct Mills / Market Tempo fields */}
          {(form.shippingMode === "DirectMills" || form.shippingMode === "MarketTempo") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vehicle No</Label>
                <Input placeholder="GJ05AB1234" value={form.vehicleNo} onChange={(e) => set("vehicleNo", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label>Driver Mobile No</Label>
                <Input placeholder="9876543210" value={form.driverMobile} onChange={(e) => set("driverMobile", e.target.value)} />
              </div>
            </div>
          )}

          {/* LR fields */}
          {form.shippingMode === "ByLR" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Transport Name</Label>
                <Input placeholder="GATI / Blue Dart" value={form.transportName} onChange={(e) => set("transportName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>LR No</Label>
                <Input placeholder="LR12345" value={form.lrNo} onChange={(e) => set("lrNo", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>LR Date</Label>
                <Input type="date" value={form.lrDate} onChange={(e) => set("lrDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>No. of Bales</Label>
                <Input type="number" placeholder="5" value={form.noBales} onChange={(e) => set("noBales", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Bale No</Label>
                <Input placeholder="B001–B005" value={form.baleNo} onChange={(e) => set("baleNo", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Cheque Amount (₹)</Label>
                <Input type="number" placeholder="0" value={form.chequeAmount} onChange={(e) => set("chequeAmount", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Receiver Name</Label>
                <Input placeholder="Receiver name" value={form.receiverName} onChange={(e) => set("receiverName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Receiver Mobile</Label>
                <Input placeholder="9876543210" value={form.receiverMobile} onChange={(e) => set("receiverMobile", e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => router.push("/orders")} className="cursor-pointer">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer px-8">
          {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
          {saving ? "Saving..." : "Create Order"}
        </Button>
      </div>
    </div>
  );
}
