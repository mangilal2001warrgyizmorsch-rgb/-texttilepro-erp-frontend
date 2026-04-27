"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Calculator,
  Plus,
  Trash2,
  Layers,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function NewLotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledChallanId = searchParams.get("challanId");

  // Fetch data
  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.get<any[]>("/accounts"),
  });
  const accounts =
    (accountsData as any)?.data ||
    (Array.isArray(accountsData) ? accountsData : []);

  const { data: qualitiesData } = useQuery({
    queryKey: ["qualities"],
    queryFn: () => api.get<any[]>("/qualities"),
  });
  const qualities =
    (qualitiesData as any)?.data ||
    (Array.isArray(qualitiesData) ? qualitiesData : []);

  const { data: weaversData } = useQuery({
    queryKey: ["weavers"],
    queryFn: () => api.get<any[]>("/weavers"),
  });
  const weavers =
    (weaversData as any)?.data ||
    (Array.isArray(weaversData) ? weaversData : []);

  const { data: challanResponse } = useQuery({
    queryKey: ["challan", prefilledChallanId],
    queryFn: () =>
      prefilledChallanId
        ? api.get<any>(`/challans/${prefilledChallanId}`)
        : Promise.resolve(null),
    enabled: !!prefilledChallanId,
  });

  const challan = challanResponse?.data || challanResponse;

  // Fetch associated order if available
  const { data: orderResponse } = useQuery({
    queryKey: ["order", challan?.orderId],
    queryFn: () =>
      challan?.orderId
        ? api.get<any>(`/orders/${challan.orderId}`)
        : Promise.resolve(null),
    enabled: !!challan?.orderId,
  });
  const order = orderResponse?.data || orderResponse;

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    challanDate: today,
    firm: "",
    challanNo: "",
    lotBookType: "GREY INWARD UNIT 02",
    party: "",
    address: "",
    masterAc: "",
    agent: "",
    gstinNo: "",
    markaHelp: "",
    marka: "",
    lotNo: "",
    lotCode: "CFM",
    quality: "",
    hsnCode: "",
    taka: 0,
    meter: 0,
    dyedPrint: "Dyed",
    lrNo: "",
    lrDate: "",
    transpoter: "",
    remark: "",
    fasRate: 0,
    amount: 0,
    weight: 0,
    chadhti: 0,
    total: 0,
    width: 0,
  });

  const [takaDetails, setTakaDetails] = useState<any[]>([]);

  // Auto-fill from challan, order, and ALL masters
  useEffect(() => {
    if (challan) {
      // Find matching account (Firm)
      const firmAccount = accounts.find(
        (a: any) =>
          a._id === challan.firmId ||
          a.name === (challan.firm || challan.firmName),
      );

      // Find matching account (Transporter)
      const transportAccount = accounts.find(
        (a: any) =>
          a.roleType === "Transporter" &&
          (a._id === challan.transporterId || a.name === challan.transpoter),
      );

      // Find matching quality
      const qualityMaster = qualities.find(
        (q: any) =>
          q._id === challan.qualityId ||
          q.name === (challan.quality || challan.qualityName) ||
          q.name === order?.qualityName,
      );

      setForm((prev) => ({
        ...prev,
        firm:
          firmAccount?.name ||
          challan.firm ||
          challan.firmName ||
          order?.firmName ||
          "",
        challanNo: challan.challan_no || challan.challanNo || "",
        challanDate: (challan.challan_date || challan.date || today).split(
          "T",
        )[0],
        party:
          challan.party ||
          challan.marka ||
          order?.marka ||
          firmAccount?.name ||
          "",
        marka: challan.marka || challan.party || order?.marka || "",
        gstinNo: firmAccount?.gstin || challan.gstin_no || order?.gstin || "",
        address:
          firmAccount?.address || challan.address || order?.address || "",
        masterAc: order?.masterName || challan.masterAc || "",
        quality:
          qualityMaster?.name ||
          challan.quality ||
          challan.qualityName ||
          order?.qualityName ||
          "",
        hsnCode:
          qualityMaster?.hsnCode || challan.hsnCode || order?.hsnCode || "4507",
        taka: challan.taka || challan.totalTaka || 0,
        meter: challan.meter || challan.totalMeter || 0,
        lrNo: challan.lr_no || order?.lrNo || "",
        lrDate:
          challan.lr_date || order?.lrDate
            ? (challan.lr_date || order.lrDate).split("T")[0]
            : "",
        transpoter:
          transportAccount?.name ||
          challan.transpoter ||
          order?.transporterName ||
          "",
        weight: challan.weight || order?.weight || 0,
        chadhti: challan.chadhti || order?.chadhti || 0,
        width: challan.width || order?.width || 0,
        remark: challan.remark || order?.remark || "",
      }));

      if (challan.takaDetails && Array.isArray(challan.takaDetails)) {
        setTakaDetails(
          challan.takaDetails.map((t: any) => ({
            tn: t.takaNo || t.tn,
            meter: Number(t.meter || 0),
            balanceMtr: Number(t.meter || 0),
          })),
        );
      } else if (challan.taka || challan.totalTaka) {
        const count = Number(challan.taka || challan.totalTaka || 0);
        setTakaDetails(
          Array.from({ length: count }).map((_, i) => ({
            tn: i + 1,
            meter: 0,
            balanceMtr: 0,
          })),
        );
      }
    }
  }, [challan, order, accounts, qualities, weavers]);

  useEffect(() => {
    const amt = form.meter * form.fasRate;
    setForm((prev) => ({ ...prev, amount: amt, total: amt }));
  }, [form.meter, form.fasRate]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/lots", {
        ...form,
        challanId: prefilledChallanId,
        takaDetails,
        status: "InStorage",
      });
      toast.success("Lot created successfully");
      router.push("/lots");
    } catch (err: any) {
      toast.error(err.message || "Failed to create lot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-muted/10 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lots">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border bg-background shadow-sm"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create New Lot
            </h1>
            <p className="text-sm text-muted-foreground">
              Process delivery challan into production lot
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="font-semibold"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2 font-bold shadow-lg shadow-primary/20"
          >
            <CheckCircle size={18} />
            {submitting ? "Saving..." : "Save Lot Entry"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="text-primary" size={20} />
                General Information
              </CardTitle>
              <CardDescription>
                Primary lot details and challan references
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Firm *</Label>
                  <Input
                    value={form.firm}
                    onChange={(e) => setForm({ ...form, firm: e.target.value })}
                    className="font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Challan No. *</Label>
                  <Input
                    value={form.challanNo}
                    onChange={(e) =>
                      setForm({ ...form, challanNo: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Challan Date</Label>
                  <Input
                    type="date"
                    value={form.challanDate}
                    onChange={(e) =>
                      setForm({ ...form, challanDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Party *</Label>
                <Input
                  value={form.party}
                  onChange={(e) => setForm({ ...form, party: e.target.value })}
                  className="font-bold text-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marka</Label>
                  <Input
                    value={form.marka}
                    onChange={(e) =>
                      setForm({ ...form, marka: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN No.</Label>
                  <Input
                    value={form.gstinNo}
                    onChange={(e) =>
                      setForm({ ...form, gstinNo: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quality Name *</Label>
                <Input
                  value={form.quality}
                  onChange={(e) =>
                    setForm({ ...form, quality: e.target.value })
                  }
                  className="font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Calculator size={20} />
                Measurements & Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Total Taka *</Label>
                  <Input
                    type="number"
                    value={form.taka}
                    onChange={(e) =>
                      setForm({ ...form, taka: Number(e.target.value) })
                    }
                    className="font-black text-lg bg-primary/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Meter *</Label>
                  <Input
                    type="number"
                    value={form.meter}
                    onChange={(e) =>
                      setForm({ ...form, meter: Number(e.target.value) })
                    }
                    className="font-black text-lg bg-primary/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Process Type</Label>
                  <Select
                    value={form.dyedPrint}
                    onValueChange={(v) => setForm({ ...form, dyedPrint: v })}
                  >
                    <SelectTrigger className="font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dyed">Dyed</SelectItem>
                      <SelectItem value="Printing">Printing</SelectItem>
                      <SelectItem value="Bleached">Bleached</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>LR No.</Label>
                  <Input
                    value={form.lrNo}
                    onChange={(e) => setForm({ ...form, lrNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LR Date</Label>
                  <Input
                    type="date"
                    value={form.lrDate}
                    onChange={(e) =>
                      setForm({ ...form, lrDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transporter</Label>
                  <Input
                    value={form.transpoter}
                    onChange={(e) =>
                      setForm({ ...form, transpoter: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Taka Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-full flex flex-col shadow-lg border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
                  Taka Breakdown
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-bold hover:bg-primary/10"
                  onClick={() => {
                    const nextTn =
                      takaDetails.length > 0
                        ? Math.max(...takaDetails.map((t) => t.tn)) + 1
                        : 1;
                    setTakaDetails([
                      ...takaDetails,
                      { tn: nextTn, meter: 0, balanceMtr: 0 },
                    ]);
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[500px]">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-muted-foreground w-12">
                      #
                    </th>
                    <th className="px-4 py-2 text-left font-bold text-muted-foreground">
                      Taka No
                    </th>
                    <th className="px-4 py-2 text-left font-bold text-muted-foreground">
                      Meter
                    </th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {takaDetails.map((t, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 group">
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          value={t.tn}
                          onChange={(e) => {
                            const newDetails = [...takaDetails];
                            newDetails[idx].tn = Number(e.target.value);
                            setTakaDetails(newDetails);
                          }}
                          className="h-8 border-none bg-muted/40 focus-visible:ring-1 text-center font-mono"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          value={t.meter || ""}
                          placeholder="0"
                          onChange={(e) => {
                            const newDetails = [...takaDetails];
                            newDetails[idx].meter = Number(e.target.value);
                            newDetails[idx].balanceMtr = Number(e.target.value);
                            setTakaDetails(newDetails);
                          }}
                          className="h-8 border-none bg-muted/40 focus-visible:ring-1 font-bold text-primary"
                        />
                      </td>
                      <td className="px-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                          onClick={() =>
                            setTakaDetails(
                              takaDetails.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <Trash2 size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
            <div className="p-4 border-t bg-muted/10">
              <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Sum
                  </span>
                  <span className="text-xl font-black text-emerald-500 font-mono">
                    {takaDetails
                      .reduce((acc, curr) => acc + (Number(curr.meter) || 0), 0)
                      .toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Target
                  </span>
                  <span className="text-xl font-black text-muted-foreground/40 font-mono">
                    {form.meter || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
