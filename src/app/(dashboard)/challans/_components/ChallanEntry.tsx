"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChallanEntryProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function ChallanEntry({ initialData, onSuccess }: ChallanEntryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const orderId = searchParams.get("orderId");
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

  const accounts = useMemo(() => 
    (accountsData as any)?.data || (Array.isArray(accountsData) ? accountsData : []),
    [accountsData]
  );

  const { data: qualitiesData } = useQuery({
    queryKey: ["qualities"],
    queryFn: () => api.get<any[]>("/qualities"),
  });
  const qualities = useMemo(() => 
    (qualitiesData as any)?.data || (Array.isArray(qualitiesData) ? qualitiesData : []),
    [qualitiesData]
  );

  const { data: weaversData } = useQuery({
    queryKey: ["weavers"],
    queryFn: () => api.get<any[]>("/weavers"),
  });
  const weavers = useMemo(() => 
    (weaversData as any)?.data || (Array.isArray(weaversData) ? weaversData : []),
    [weaversData]
  );

  const mills = (accounts ?? []).filter(
    (a) => a.roleType === "Mill" && a.isActive,
  );
  const masterAccounts = (accounts ?? []).filter(
    (a) =>
      ["Master", "Customer", "Supplier"].includes(a.roleType) && a.isActive,
  );
  const transporters = (accounts ?? []).filter(
    (a) => a.roleType === "Transporter" && a.isActive,
  );

  const today = new Date().toISOString().split("T")[0];
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || initialData?.orderId || "");
  const [submitting, setSubmitting] = useState(false);
  const hasInitialized = useRef<string | null>(null);

  const [form, setForm] = useState({
    challan_no: "",
    date: today,
    challan_date: today,
    firm: "",
    party: "",
    gstin_no: "",
    party_address: "",
    quality: "",
    hsn_code: "",
    item: "",
    taka: "",
    meter: "",
    dyed_print: "",
    weaver: "",
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
    remark: "",
  });

  // Load existing challan for editing
  useEffect(() => {
    if (initialData && hasInitialized.current !== editId) {
      setForm({
        challan_no: initialData.challan_no || "",
        date: (initialData.date || today).split("T")[0],
        challan_date: (initialData.challan_date || initialData.date || today).split("T")[0],
        firm: initialData.firm || "",
        party: initialData.party || "",
        gstin_no: initialData.gstin_no || "",
        party_address: initialData.party_address || "",
        quality: initialData.quality || "",
        hsn_code: initialData.hsn_code || "",
        item: initialData.item || "",
        taka: initialData.taka || "",
        meter: initialData.meter || "",
        dyed_print: initialData.dyed_print || "",
        weaver: initialData.weaver || "",
        fas_rate: initialData.fas_rate || "",
        amount: initialData.amount || "",
        weight: initialData.weight || "",
        total: initialData.total || "",
        chadhti: initialData.chadhti || "",
        width: initialData.width || "",
        pu_bill_no: initialData.pu_bill_no || "",
        lr_no: initialData.lr_no || "",
        lr_date: initialData.lr_date ? initialData.lr_date.split("T")[0] : "",
        transpoter: initialData.transpoter || "",
        remark: initialData.remark || "",
      });
      hasInitialized.current = editId;
    }
  }, [initialData, editId, today]);

  const selectedOrder = orders?.find((o: any) => o._id === selectedOrderId);

  // Auto-fill when order is selected (only if not editing)
  useEffect(() => {
    if (selectedOrder && !editId && hasInitialized.current !== selectedOrderId) {
      setForm((prev) => ({
        ...prev,
        firm: selectedOrder.firmName || "",
        party: selectedOrder.masterName || selectedOrder.partyName || "",
        challan_no: selectedOrder.partyChNo || selectedOrder.challanNo || "",
        gstin_no: selectedOrder.gstin || "",
        party_address: selectedOrder.address || "",
        quality: selectedOrder.qualityName || "",
        hsn_code: selectedOrder.hsn || "",
        taka: selectedOrder.totalTaka?.toString() || "",
        meter: selectedOrder.totalMeter?.toString() || "",
        weaver: selectedOrder.weaverName || "",
        weight: selectedOrder.weight?.toString() || "0",
        width: selectedOrder.width?.toString() || "0",
        chadhti: (
          selectedOrder.chadhti ||
          selectedOrder.chadti ||
          0
        ).toString(),
        lr_no: selectedOrder.lrNo || "",
        lr_date: selectedOrder.lrDate || "",
        transpoter:
          selectedOrder.transporterName || selectedOrder.transportName || "",
      }));
      hasInitialized.current = selectedOrderId;
    }
  }, [selectedOrder, selectedOrderId, editId]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId && !editId) {
      toast.error("Please select an order first");
      return;
    }

    if (!form.firm || !form.party || !form.quality || !form.taka || !form.meter) {
      toast.error("Please fill all required fields (Firm, Party, Quality, Taka, Meter)");
      return;
    }

    setSubmitting(true);
    try {
      let finalTotal = form.total || form.amount || "";
      const payload = {
        ...form,
        total: finalTotal,
        orderId: selectedOrderId || initialData?.orderId,
        table: initialData?.table || [],
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
      toast.error(err.message || `Failed to ${editId ? "update" : "create"} challan`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/challans">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {editId ? "Edit Challan" : "Generate New Challan"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {editId ? "Update existing delivery challan details" : "Issue a challan against a draft order"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 bg-muted/20 border-b">
          <div className="space-y-1.5 max-w-md">
            <Label className="font-semibold text-primary">
              Select Draft Order *
            </Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId} disabled={!!editId}>
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
                    {order.firmName} — {order.marka} — {order.qualityName} (
                    {order.totalMeter}m)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(selectedOrder || editId) && (
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <FileText size={16} className="text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Basic Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Date <span className="text-red-500">*</span></Label>
                  <Input type="date" className="h-9" value={form.date} onChange={(e) => updateField("date", e.target.value)} required />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Challan Date <span className="text-red-500">*</span></Label>
                  <Input type="date" className="h-9" value={form.challan_date} onChange={(e) => updateField("challan_date", e.target.value)} required />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Challan No. <span className="text-red-500">*</span></Label>
                  <Input className="h-9" placeholder="e.g. 117" value={form.challan_no} onChange={(e) => updateField("challan_no", e.target.value)} required />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Firm <span className="text-red-500">*</span></Label>
                  <Select value={form.firm} onValueChange={(v) => updateField("firm", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Firm" /></SelectTrigger>
                    <SelectContent>
                      {mills.map((m) => (<SelectItem key={m._id} value={m.accountName}>{m.accountName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Party <span className="text-red-500">*</span></Label>
                  <Select value={form.party} onValueChange={(v) => updateField("party", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Party" /></SelectTrigger>
                    <SelectContent>
                      {masterAccounts.map((p) => (<SelectItem key={p._id} value={p.accountName}>{p.accountName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">GSTIN No.</Label>
                  <Input className="h-9" placeholder="343FDJFSD324" value={form.gstin_no} onChange={(e) => updateField("gstin_no", e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Party Address</Label>
                  <Input className="h-9" placeholder="akola" value={form.party_address} onChange={(e) => updateField("party_address", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Package size={16} className="text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Item & Quality</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-4">
                  <Label className="text-xs">Quality <span className="text-red-500">*</span></Label>
                  <Select value={form.quality} onValueChange={(v) => updateField("quality", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Quality" /></SelectTrigger>
                    <SelectContent>
                      {qualities?.map((q: any) => (<SelectItem key={q._id} value={q.qualityName}>{q.qualityName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-4">
                  <Label className="text-xs">HSN Code</Label>
                  <Input className="h-9" placeholder="e.g. 540710" value={form.hsn_code} onChange={(e) => updateField("hsn_code", e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-4">
                  <Label className="text-xs">Item</Label>
                  <Input className="h-9" placeholder="Item description" value={form.item} onChange={(e) => updateField("item", e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Taka <span className="text-red-500">*</span></Label>
                  <Input type="number" className="h-9" placeholder="0" value={form.taka} onChange={(e) => updateField("taka", e.target.value)} required />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Meter <span className="text-red-500">*</span></Label>
                  <Input type="number" step="0.01" className="h-9" placeholder="0.00" value={form.meter} onChange={(e) => updateField("meter", e.target.value)} required />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Dyed / Print</Label>
                  <Select value={form.dyed_print} onValueChange={(v) => updateField("dyed_print", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="-- Select --" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dyed">Dyed</SelectItem>
                      <SelectItem value="Print">Print</SelectItem>
                      <SelectItem value="Grey">Grey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Weaver</Label>
                  <Select value={form.weaver} onValueChange={(v) => updateField("weaver", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Weaver" /></SelectTrigger>
                    <SelectContent>
                      {weavers?.map((w: any) => (<SelectItem key={w._id} value={w.weaverName}>{w.weaverName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Receipt size={16} className="text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Rates & Amounts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">FAS Rate</Label><Input type="number" step="0.01" className="h-9" value={form.fas_rate} onChange={(e) => updateField("fas_rate", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Amount</Label><Input type="number" step="0.01" className="h-9" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Weight</Label><Input type="number" step="0.001" className="h-9" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Total (auto)</Label><Input type="number" step="0.001" className="h-9 bg-muted" value={form.total} readOnly /></div>
                <div className="space-y-1.5"><Label className="text-xs">Chadhti</Label><Input type="number" step="0.01" className="h-9" value={form.chadhti} onChange={(e) => updateField("chadhti", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Width</Label><Input type="number" step="0.01" className="h-9" value={form.width} onChange={(e) => updateField("width", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">PU Bill No.</Label><Input className="h-9" value={form.pu_bill_no} onChange={(e) => updateField("pu_bill_no", e.target.value)} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Truck size={16} className="text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Dispatch Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">LR No.</Label><Input className="h-9" value={form.lr_no} onChange={(e) => updateField("lr_no", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">LR Date</Label><Input type="date" className="h-9" value={form.lr_date} onChange={(e) => updateField("lr_date", e.target.value)} /></div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Transporter</Label>
                  <Select value={form.transpoter} onValueChange={(v) => updateField("transpoter", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Transporter" /></SelectTrigger>
                    <SelectContent>
                      {transporters.map((t: any) => (<SelectItem key={t._id} value={t.accountName}>{t.accountName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-3"><Label className="text-xs">Remark</Label><Input className="h-9" value={form.remark} onChange={(e) => updateField("remark", e.target.value)} /></div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" size="lg" className="bg-primary hover:opacity-90 gap-2 cursor-pointer shadow-sm" disabled={submitting}>
                <CheckCircle size={18} />
                {submitting ? (editId ? "Updating..." : "Generating...") : (editId ? "Update Challan" : "Generate Challan")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
