"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Package,
  Receipt,
  Truck,
  Trash2,
  Loader2,
  User,
  X,
  Scissors,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChallanEntryProps {
  initialData?: any;
  initialOrderId?: string;
  onSuccess?: () => void;
}

export function ChallanEntry({ initialData, initialOrderId, onSuccess }: ChallanEntryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const orderId = initialOrderId || searchParams.get("orderId");
  const editId = initialData?._id;

  const { data: ordersResponse } = useQuery({
    queryKey: ["orders", "challan-source", orderId],
    queryFn: async () => {
      if (orderId) {
        const res = await api.get<any>(`/orders/${orderId}`);
        const data = res?.data || res;
        return Array.isArray(data) ? data : [data];
      }
      const res = await api.get<any>("/orders?status=draft,PendingChallan");
      return res?.data || (Array.isArray(res) ? res : []);
    },
  });
  const orders = ordersResponse || [];

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.get<any[]>("/accounts"),
  });
  const accounts = useMemo(
    () =>
      (accountsData as any)?.data ||
      (Array.isArray(accountsData) ? accountsData : []),
    [accountsData],
  );

  const { data: qualitiesData } = useQuery({
    queryKey: ["qualities"],
    queryFn: () => api.get<any[]>("/qualities"),
  });
  const qualities = useMemo(
    () =>
      (qualitiesData as any)?.data ||
      (Array.isArray(qualitiesData) ? qualitiesData : []),
    [qualitiesData],
  );

  const { data: weaversData } = useQuery({
    queryKey: ["weavers"],
    queryFn: () => api.get<any[]>("/weavers"),
  });
  const weavers = useMemo(
    () =>
      (weaversData as any)?.data ||
      (Array.isArray(weaversData) ? weaversData : []),
    [weaversData],
  );

  const mills = useMemo(() => (accounts ?? []).filter(
    (a) => a.roleType === "Mill" && a.isActive,
  ), [accounts]);
  
  const masterAccounts = useMemo(() => (accounts ?? []).filter(
    (a) =>
      ["Master", "Customer", "Supplier"].includes(a.roleType) && a.isActive,
  ), [accounts]);
  
  const transporters = useMemo(() => (accounts ?? []).filter(
    (a) => a.roleType === "Transporter" && a.isActive,
  ), [accounts]);
  
  // Weavers come from both the Weaver collection AND Account collection (roleType: "Weaver")
  const weaverAccounts = useMemo(() => (accounts ?? []).filter(
    (a) => a.roleType === "Weaver",
  ), [accounts]);
  // Merge: Account weavers (mapped to match Weaver shape) + Weaver collection entries
  const allWeavers = useMemo(() => {
    const fromAccounts = weaverAccounts.map((a) => ({
      _id: a._id,
      weaverName: a.accountName,
      _source: "account",
    }));
    const fromWeavers = (weavers ?? []).filter(
      (w: any) => !fromAccounts.some((a) => a._id === w._id),
    );
    return [...fromAccounts, ...fromWeavers];
  }, [weaverAccounts, weavers]);

  const today = new Date().toISOString().split("T")[0];
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orderId || initialData?.orderId || "",
  );
  const [submitting, setSubmitting] = useState(false);
  const hasInitialized = useRef<string | null>(null);
  const [table, setTable] = useState<{ tn: string; meter: string }[]>([]);

  const totalTakaCount = useMemo(() => table.length, [table]);
  const totalMeterValue = useMemo(
    () =>
      table.reduce(
        (sum, row) => sum + (parseFloat(row.meter || "") || 0),
        0,
      ),
    [table],
  );

  const [form, setForm] = useState({
    challan_no: "",
    date: today,
    challan_date: today,
    firm: "",
    firmId: "",
    party: "",
    partyId: "",
    gstin_no: "",
    party_address: "",
    quality: "",
    qualityId: "",
    hsn_code: "",
    item: "",
    taka: "",
    meter: "",
    dyed_print: "",
    weaver: "",
    weaverId: "",
    fas_rate: "",
    amount: "",
    weight: "",
    total: "",
    chadhti: "",
    width: "",
    pu_bill_no: "",
    lr_no: "",
    lr_date: "",
    transpoter: "",
    transporterId: "",
    remark: "",
  });

  // Load existing challan for editing
  useEffect(() => {
    if (initialData && hasInitialized.current !== editId) {
      setForm({
        challan_no: initialData.challan_no || "",
        date: (initialData.date || today).split("T")[0],
        challan_date: (
          initialData.challan_date ||
          initialData.date ||
          today
        ).split("T")[0],
        firm: initialData.firm || "",
        firmId: initialData.firmId || "",
        party: initialData.party || "",
        partyId: initialData.partyId || "",
        gstin_no: initialData.gstin_no || "",
        party_address: initialData.party_address || "",
        quality: initialData.quality || "",
        qualityId: initialData.qualityId || "",
        hsn_code: initialData.hsn_code || "",
        item: initialData.item || "",
        taka: initialData.taka || "",
        meter: initialData.meter || "",
        dyed_print: initialData.dyed_print || "",
        weaver: initialData.weaver || "",
        weaverId: initialData.weaverId || "",
        fas_rate: initialData.fas_rate || "",
        amount: initialData.amount || "",
        weight: initialData.weight || "",
        total: initialData.total || "",
        chadhti: initialData.chadhti || "",
        width: initialData.width || "",
        pu_bill_no: initialData.pu_bill_no || "",
        lr_no: initialData.lr_no || "",
        lr_date: initialData.lr_date
          ? initialData.lr_date.split("T")[0]
          : "",
        transpoter: initialData.transpoter || "",
        transporterId: initialData.transporterId || "",
        remark: initialData.remark || "",
      });

      setTable(
        (initialData.table || initialData.takaDetails || []).map(
          (row: any) => ({
            tn:
              row.takaNo && isNaN(row.takaNo)
                ? row.takaNo.toString()
                : "",
            meter: (row.meter ?? "").toString(),
          }),
        ),
      );

      hasInitialized.current = editId;
    }
  }, [initialData, editId, today]);

  const selectedOrder = orders?.find(
    (o: any) => o._id === selectedOrderId,
  );

  // ─── AUTO-FILL: Phase 1 — text fields immediately when order loads ────────
  const textFieldsApplied = useRef<string | null>(null);
  useEffect(() => {
    if (selectedOrder && !editId && textFieldsApplied.current !== selectedOrderId) {
      const o = selectedOrder;
      const partySnap = o.partyDetails || {};

      const safeId = (val: any) => val?._id?.toString() || val?.toString() || "";

      const mapOrderToChallan = (order: any, snap: any) => ({
        challan_no: order.partyChallanNo || order.partyChNo || "",
        date: (order.orderDate || order.createdAt || new Date().toISOString()).split("T")[0],
        challan_date: (order.orderDate || order.createdAt || new Date().toISOString()).split("T")[0],
        firm: order.firmName || "",
        firmId: safeId(order.firmId),
        party: order.partyName || "",
        partyId: safeId(order.partyId),
        gstin_no: order.partyGstin || snap.gstin || order.gstin || "",
        party_address: order.partyAddress || snap.address || order.address || "",
        quality: order.qualityName || "",
        qualityId: safeId(order.qualityId),
        hsn_code: order.qualityDetails?.hsnCode || order.hsnCode || "",
        item: order.qualityDetails?.itemDescription || order.itemDescription || "",
        taka: order.totalTaka?.toString() || "",
        meter: order.totalMeter?.toString() || "",
        dyed_print: "",
        weaver: order.weaverName || "",
        weaverId: safeId(order.weaverId),
        fas_rate: order.jobRate?.toString() || "",
        amount: order.greyRate?.toString() || "",
        weight: order.weight?.toString() || "",
        total: order.totalTaka?.toString() || "",
        chadhti: (order.chadti ?? order.chadhti ?? "").toString(),
        width: order.width?.toString() || "",
        pu_bill_no: order.weaverMarka || order.weaverChNo || "",
        lr_no: order.lrNo || "",
        lr_date: order.lrDate ? order.lrDate.split("T")[0] : "",
        transpoter: order.transporterName || "",
        transporterId: order.transporterId || "",
        remark: order.brokerName ? `Broker: ${order.brokerName}` : "",
      });

      setForm((prev) => ({
        ...prev,
        ...mapOrderToChallan(o, partySnap)
      }));

      if (o.takaDetails && o.takaDetails.length > 0) {
        setTable(
          o.takaDetails.map((row: any) => ({
            tn: row.takaNo?.toString() ?? "",
            meter: (row.meter ?? "").toString(),
          })),
        );
      }

      textFieldsApplied.current = selectedOrderId;
      hasInitialized.current = selectedOrderId;

      toast.success("✅ Order data auto-filled", { duration: 3000 });
    }
  }, [selectedOrder, selectedOrderId, editId]);

  // ─── AUTO-FILL: Phase 2 — synchronize IDs when master lists load ──────────
  useEffect(() => {
    if (!selectedOrder || editId) return;
    const o = selectedOrder;
    const updates: Record<string, string> = {};
    const safeId = (val: any) => val?._id?.toString() || val?.toString() || "";

    const cleanName = (n: any) => (n || "").toString().toLowerCase().trim();

    // 1. Firm Match - ALWAYS FORCE JAI MATA DI
    if (mills.length > 0) {
      const FIXED_FIRM_GSTIN = "24AABCA9842L1ZG";
      let match = mills.find((m) => m.gstin?.trim().toUpperCase() === FIXED_FIRM_GSTIN || cleanName(m.accountName).includes("jai mata di"));
      if (!match) match = o.firmId ? mills.find(m => m._id === safeId(o.firmId)) : undefined;
      if (!match && o.firmName) match = mills.find(m => cleanName(m.accountName) === cleanName(o.firmName));
      if (match && form.firmId !== match._id) {
        updates.firmId = match._id;
        updates.firm = match.accountName;
      }
    }

    // 2. Party Match
    if (masterAccounts.length > 0) {
      let match = o.partyId ? masterAccounts.find(p => p._id === safeId(o.partyId)) : undefined;
      if (!match && o.partyName) match = masterAccounts.find(p => cleanName(p.accountName) === cleanName(o.partyName));
      if (match && form.partyId !== match._id) {
        updates.partyId = match._id;
        updates.party = match.accountName;
      }
    }

    // 3. Quality Match
    if (qualities.length > 0) {
      let match = o.qualityId ? qualities.find(q => q._id === safeId(o.qualityId)) : undefined;
      if (!match && o.qualityName) match = qualities.find(q => cleanName(q.qualityName) === cleanName(o.qualityName));
      if (match && form.qualityId !== match._id) {
        updates.qualityId = match._id;
        updates.quality = match.qualityName;
        if (match.hsnCode && !form.hsn_code) updates.hsn_code = match.hsnCode;
      }
    }

    // 4. Weaver Match
    if (allWeavers.length > 0) {
      let match = o.weaverId ? allWeavers.find(w => w._id === safeId(o.weaverId)) : undefined;
      if (!match && o.weaverName) match = allWeavers.find(w => cleanName(w.weaverName) === cleanName(o.weaverName));
      if (match && form.weaverId !== match._id) {
        updates.weaverId = match._id;
        updates.weaver = match.weaverName;
      }
    }

    if (Object.keys(updates).length > 0) {
      setForm((prev) => ({ ...prev, ...updates }));
    }
  }, [selectedOrder, editId, mills, masterAccounts, qualities, allWeavers, transporters]);

  // Sync taka table totals → form fields automatically
  useEffect(() => {
    if (table.length > 0) {
      setForm((prev) => ({
        ...prev,
        taka: totalTakaCount.toString(),
        meter: totalMeterValue.toFixed(2).replace(/\.00$/, ""),
      }));
    }
  }, [totalTakaCount, totalMeterValue, table.length]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId && !editId) {
      toast.error("Please select an order first");
      return;
    }
    if (
      !form.firm ||
      !form.party ||
      !form.quality ||
      !form.taka ||
      !form.meter
    ) {
      toast.error(
        "Please fill all required fields (Firm, Party, Quality, Taka, Meter)",
      );
      return;
    }

    setSubmitting(true);
    try {
      const finalTotal = form.total || form.amount || "";
      const payload = {
        ...form,
        total: finalTotal,
        orderId: selectedOrderId || initialData?.orderId || undefined,
        // Sanitize empty ObjectId strings to undefined
        firmId: form.firmId || undefined,
        partyId: form.partyId || undefined,
        qualityId: form.qualityId === "CUSTOM" ? undefined : (form.qualityId || undefined),
        weaverId: form.weaverId || undefined,
        transporterId: form.transporterId || undefined,
        table: table.map((row) => ({
          tn: row.tn?.trim() ? Number(row.tn) : undefined,
          meter: row.meter,
        })),
      };

      if (editId) {
        await api.put(`/challans/${editId}`, payload);
        toast.success("Challan updated successfully");
      } else {
        await api.post("/challans", payload);
        toast.success("Challan generated successfully");
      }

      qc.invalidateQueries({ queryKey: ["challan"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      if (onSuccess) onSuccess();
      else router.push("/challans");
    } catch (err: any) {
      toast.error(
        err.message || `Failed to ${editId ? "update" : "create"} challan`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto space-y-6">
      {/* Selection Card */}
        {!editId && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package size={16} className="text-primary" /> Select Draft
                Order *
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="max-w-md">
                <Select
                  value={selectedOrderId || undefined}
                  onValueChange={setSelectedOrderId}
                >
                  <SelectTrigger className="h-10 bg-background">
                    <SelectValue
                      placeholder={
                        orders === undefined
                          ? "Loading draft orders..."
                          : "Select an order to auto-fill..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {orders?.length === 0 && (
                      <SelectItem value="none" disabled>
                        No draft orders found
                      </SelectItem>
                    )}
                    {orders?.map((order: any) => (
                      <SelectItem key={order._id} value={order._id}>
                        {order.firmName} — {order.marka} —{" "}
                        {order.qualityName} ({order.totalMeter}m)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {(selectedOrder || editId) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Side: Form Fields */}
              <div className="lg:col-span-8 space-y-6">
                {/* Basic Details */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText size={16} className="text-primary" /> Basic
                      Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-6 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Date *
                      </Label>
                      <Input
                        type="date"
                        className="h-10"
                        value={form.date}
                        onChange={(e) => updateField("date", e.target.value)}
                        required/>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Challan Date *
                      </Label>
                      <Input
                        type="date"
                        className="h-10"
                        value={form.challan_date}
                        onChange={(e) =>
                          updateField("challan_date", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Challan No. *
                      </Label>
                      <Input
                        className="h-10"
                        placeholder="e.g. 117"
                        value={form.challan_no}
                        onChange={(e) =>
                          updateField("challan_no", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Firm *
                      </Label>
                      <Select
                        key={`firm-${mills.length}-${form.firmId}`}
                        value={form.firmId || undefined}
                        onValueChange={(v) => {
                          const m = mills.find((x) => x._id === v);
                          setForm((prev) => ({
                            ...prev,
                            firmId: v,
                            firm: m?.accountName || "",
                          }));
                        }}
                        disabled
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Firm" />
                        </SelectTrigger>
                        <SelectContent>
                          {mills.map((m) => (
                            <SelectItem key={m._id} value={m._id}>
                              {m.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Party *
                      </Label>
                      <Select
                        key={`party-${masterAccounts.length}-${form.partyId}`}
                        value={form.partyId || undefined}
                        onValueChange={(v) => {
                          const p = masterAccounts.find((x) => x._id === v);
                          setForm((prev) => ({
                            ...prev,
                            partyId: v,
                            party: p?.accountName || "",
                            gstin_no: p?.gstin || prev.gstin_no,
                            party_address: p?.address || prev.party_address,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Party" />
                        </SelectTrigger>
                        <SelectContent>
                          {masterAccounts.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        GSTIN No.
                      </Label>
                      <Input
                        className="h-10"
                        placeholder="343FDJFSD324"
                        value={form.gstin_no}
                        onChange={(e) =>
                          updateField("gstin_no", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Party Address
                      </Label>
                      <Input
                        className="h-10"
                        placeholder="Enter Address"
                        value={form.party_address}
                        onChange={(e) =>
                          updateField("party_address", e.target.value)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Item & Quality */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Package size={16} className="text-primary" /> Item &
                      Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="space-y-2 md:col-span-4">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Quality *
                      </Label>
                      <Select
                        key={`quality-${qualities?.length}-${form.qualityId}`}
                        value={form.qualityId || (form.quality ? "CUSTOM" : undefined)}
                        onValueChange={(v) => {
                          if (v === "CUSTOM") return;
                          const q = qualities?.find((x) => x._id === v);
                          setForm((prev) => ({
                            ...prev,
                            qualityId: v,
                            quality: q?.qualityName || "",
                            hsn_code: q?.hsnCode || prev.hsn_code,
                            item: q?.itemDescription || prev.item,
                            fas_rate: q?.defaultJobRate?.toString() || prev.fas_rate,
                            amount: q?.greyRate?.toString() || prev.amount,
                            width: q?.width?.toString() || prev.width,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Quality" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualities?.map((q: any) => (
                            <SelectItem key={q._id} value={q._id}>
                              {q.qualityName}
                            </SelectItem>
                          ))}
                          {!form.qualityId && form.quality && (
                            <SelectItem value="CUSTOM">
                              {form.quality} (from Order)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-4">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        HSN Code
                      </Label>
                      <Input
                        className="h-10"
                        placeholder="e.g. 540710"
                        value={form.hsn_code}
                        onChange={(e) =>
                          updateField("hsn_code", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-4">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Item
                      </Label>
                      <Input
                        className="h-10"
                        placeholder="Item description"
                        value={form.item}
                        onChange={(e) => updateField("item", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Taka *
                      </Label>
                      <Input
                        type="number"
                        className="h-10"
                        placeholder="0"
                        value={form.taka}
                        onChange={(e) => updateField("taka", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Meter *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10"
                        placeholder="0.00"
                        value={form.meter}
                        onChange={(e) => updateField("meter", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Dyed / Print
                      </Label>
                      <Select
                        value={form.dyed_print || undefined}
                        onValueChange={(v) => updateField("dyed_print", v)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="-- Select --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dyed">Dyed</SelectItem>
                          <SelectItem value="Print">Print</SelectItem>
                          <SelectItem value="Grey">Grey</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Weaver
                      </Label>
                      <Select
                        key={`weaver-${allWeavers.length}-${form.weaverId}`}
                        value={form.weaverId || undefined}
                        onValueChange={(v) => {
                          const w = allWeavers?.find((x) => x._id === v);
                          setForm((prev) => ({
                            ...prev,
                            weaverId: v,
                            weaver: w?.weaverName || "",
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Weaver" />
                        </SelectTrigger>
                        <SelectContent>
                          {allWeavers?.map((w: any) => (
                            <SelectItem key={w._id} value={w._id}>
                              {w.weaverName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Rates & Amounts */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Receipt size={16} className="text-primary" /> Rates &
                      Amounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        FAS Rate
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10"
                        value={form.fas_rate}
                        onChange={(e) =>
                          updateField("fas_rate", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Amount
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10"
                        value={form.amount}
                        onChange={(e) =>
                          updateField("amount", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Weight
                      </Label>
                      <Input
                        type="number"
                        step="0.001"
                        className="h-10"
                        value={form.weight}
                        onChange={(e) =>
                          updateField("weight", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Total (auto)
                      </Label>
                      <Input
                        type="number"
                        step="0.001"
                        className="h-10 bg-muted"
                        value={form.total}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Chadhti
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10"
                        value={form.chadhti}
                        onChange={(e) =>
                          updateField("chadhti", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Width
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10"
                        value={form.width}
                        onChange={(e) => updateField("width", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        PU Bill No.
                      </Label>
                      <Input
                        className="h-10"
                        value={form.pu_bill_no}
                        onChange={(e) =>
                          updateField("pu_bill_no", e.target.value)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Dispatch Details */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Truck size={16} className="text-primary" /> Dispatch
                      Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        LR No.
                      </Label>
                      <Input
                        className="h-10"
                        value={form.lr_no}
                        onChange={(e) =>
                          updateField("lr_no", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        LR Date
                      </Label>
                      <Input
                        type="date"
                        className="h-10"
                        value={form.lr_date}
                        onChange={(e) =>
                          updateField("lr_date", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Transporter
                      </Label>
                      <Select
                        value={form.transporterId || undefined}
                        onValueChange={(v) => {
                          const t = transporters.find((x) => x._id === v);
                          setForm((prev) => ({
                            ...prev,
                            transporterId: v,
                            transpoter: t?.accountName || "",
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Transporter" />
                        </SelectTrigger>
                        <SelectContent>
                          {transporters.map((t: any) => (
                            <SelectItem key={t._id} value={t._id}>
                              {t.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Remark
                      </Label>
                      <Input
                        className="h-10"
                        value={form.remark}
                        onChange={(e) =>
                          updateField("remark", e.target.value)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom submit */}
                <div className="flex justify-end pt-2">
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="cursor-pointer shadow-md bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {submitting
                      ? editId
                        ? "Updating..."
                        : "Generating..."
                      : editId
                        ? "Update Challan"
                        : "Generate Challan"}
                  </Button>
                </div>
              </div>

              {/* Right Side: Taka Breakdown */}
              <div className="lg:col-span-4 lg:sticky lg:top-[80px]">
                <Card className="shadow-lg border-primary/20 flex flex-col h-fit">
                  <CardHeader className="px-4 py-3 border-b bg-primary/5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                      <Scissors size={16} /> Taka Breakdown
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-bold hover:bg-primary/10"
                      onClick={() =>
                        setTable((prev) => [...prev, { tn: "", meter: "" }])
                      }
                    >
                      <Plus size={14} className="mr-1" /> Add Row
                    </Button>
                  </CardHeader>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 border-b sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left font-bold uppercase text-muted-foreground w-12">
                            #
                          </th>
                          <th className="px-4 py-2 text-left font-bold uppercase text-muted-foreground">
                            Taka No
                          </th>
                          <th className="px-4 py-2 text-left font-bold uppercase text-muted-foreground">
                            Meter
                          </th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {table.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-muted/30 group"
                          >
                            <td className="px-4 py-3 font-mono text-muted-foreground text-center">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-1">
                              <Input
                                className="h-8 border-none bg-muted/40 focus-visible:ring-1 text-center font-mono"
                                placeholder="-"
                                value={row.tn || ""}
                                onChange={(e) => {
                                  const next = [...table];
                                  next[idx].tn = e.target.value;
                                  setTable(next);
                                }}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input
                                type="number"
                                step="0.01"
                                className="h-8 border-none bg-muted/40 focus-visible:ring-1 font-bold text-primary"
                                placeholder="0"
                                value={row.meter || ""}
                                onChange={(e) => {
                                  const next = [...table];
                                  next[idx].meter = e.target.value;
                                  setTable(next);
                                }}
                              />
                            </td>
                            <td className="px-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                                onClick={() =>
                                  setTable(table.filter((_, i) => i !== idx))
                                }
                              >
                                <Trash2 size={12} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {table.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No breakdown rows yet. Select an order to auto-load rows.
                    </div>
                  )}
                  <div className="p-4 border-t bg-muted/10">
                    <div className="flex justify-between items-center px-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Total Taka
                        </span>
                        <span className="text-xl font-black text-emerald-500 font-mono">
                          {totalTakaCount}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Total Meter
                        </span>
                        <span className="text-xl font-black text-muted-foreground/40 font-mono">
                          {totalMeterValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
  );
}