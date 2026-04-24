"use client";

import { useState } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect } from "react";


export default function NewDispatchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledLotId = searchParams.get("lotId");

  const [submitting, setSubmitting] = useState(false);

  // Fetch all lots and filter locally to allow creating dispatch for mistakenly "Dispatched" lots
  const allLots = useQuery(api.lots.list, {});
  const dispatchableLots = (allLots ?? []).filter(l => l.status === "Finished" || l.status === "Dispatched");

  const [selectedLotId, setSelectedLotId] = useState<string | "">(
    prefilledLotId || ""
  );
  const selectedLot = dispatchableLots.find((l) => l._id === selectedLotId);

  useEffect(() => {
    if (prefilledLotId && allLots && !selectedLotId) {
      setSelectedLotId(prefilledLotId);
    }
  }, [allLots, prefilledLotId, selectedLotId]);

  const [form, setForm] = useState({
    dispatchDate: new Date().toISOString().slice(0, 10),
    shippingMode: "DirectMills" as "DirectMills" | "MarketTempo" | "ByLR",
    transportName: "",
    vehicleNo: "",
    driverMobile: "",
    lrNo: "",
    lrDate: "",
    noBales: "",
    receiverName: "",
    receiverMobile: "",
    notes: "",
  });

  const createDispatch = useMutation(api.dispatches.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) { toast.error("Please select a finished lot"); return; }
    setSubmitting(true);
    try {
      await createDispatch({
        dispatchDate: form.dispatchDate,
        orderId: selectedLot.orderId,
        lotId: selectedLot._id,
        lotNo: selectedLot.lotNo,
        partyId: selectedLot.partyId,
        partyName: selectedLot.partyName,
        marka: selectedLot.marka,
        qualityName: selectedLot.qualityName,
        finishedMeter: selectedLot.finishedMeter ?? selectedLot.totalMeter,
        shippingMode: form.shippingMode,
        transportName: form.transportName || undefined,
        vehicleNo: form.vehicleNo || undefined,
        driverMobile: form.driverMobile || undefined,
        lrNo: form.lrNo || undefined,
        lrDate: form.lrDate || undefined,
        noBales: form.noBales ? Number(form.noBales) : undefined,
        receiverName: form.receiverName || undefined,
        receiverMobile: form.receiverMobile || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Dispatch created successfully");
      router.push("/dispatch");
    } catch {
      toast.error("Failed to create dispatch");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/dispatch"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold">New Dispatch</h1>
          <p className="text-sm text-muted-foreground">Dispatch a finished lot to the party</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Lot Selection */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" /> Lot Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dispatch Date *</Label>
                <Input type="date" value={form.dispatchDate} onChange={(e) => set("dispatchDate", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Select Finished Lot *</Label>
                {allLots === undefined ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedLotId} onValueChange={(v) => setSelectedLotId(v as string)}>
                    <SelectTrigger><SelectValue placeholder="Select a finished lot" /></SelectTrigger>
                    <SelectContent>
                      {dispatchableLots.map((lot) => (
                        <SelectItem key={lot._id} value={lot._id}>
                          {lot.lotNo} — {lot.partyName} ({lot.marka})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {selectedLot && (
              <div className="rounded-lg bg-muted/30 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">Party:</span> <span className="font-medium">{selectedLot.partyName}</span></div>
                <div><span className="text-muted-foreground">Marka:</span> <span className="font-medium">{selectedLot.marka}</span></div>
                <div><span className="text-muted-foreground">Quality:</span> <span className="font-medium">{selectedLot.qualityName}</span></div>
                <div><span className="text-muted-foreground">Finished Meter:</span> <span className="font-medium text-green-400">{(selectedLot.finishedMeter ?? selectedLot.totalMeter).toLocaleString()} m</span></div>
                <div><span className="text-muted-foreground">Lot No:</span> <span className="font-mono font-medium">{selectedLot.lotNo}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transport */}
        <Card>
          <CardHeader><CardTitle className="text-base">Transport Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Shipping Mode *</Label>
              <Select value={form.shippingMode} onValueChange={(v) => set("shippingMode", v as typeof form.shippingMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DirectMills">Direct Mills</SelectItem>
                  <SelectItem value="MarketTempo">Market Tempo</SelectItem>
                  <SelectItem value="ByLR">By LR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Transport Name</Label>
                <Input placeholder="Transport company" value={form.transportName} onChange={(e) => set("transportName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle No</Label>
                <Input placeholder="GJ-01-AB-1234" value={form.vehicleNo} onChange={(e) => set("vehicleNo", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Driver Mobile</Label>
                <Input placeholder="9876543210" value={form.driverMobile} onChange={(e) => set("driverMobile", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>No. of Bales</Label>
                <Input type="number" placeholder="0" value={form.noBales} onChange={(e) => set("noBales", e.target.value)} />
              </div>
            </div>

            {form.shippingMode === "ByLR" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>LR Number</Label>
                  <Input placeholder="LR No." value={form.lrNo} onChange={(e) => set("lrNo", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>LR Date</Label>
                  <Input type="date" value={form.lrDate} onChange={(e) => set("lrDate", e.target.value)} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Receiver Name</Label>
                <Input placeholder="Person at delivery" value={form.receiverName} onChange={(e) => set("receiverName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Receiver Mobile</Label>
                <Input placeholder="9876543210" value={form.receiverMobile} onChange={(e) => set("receiverMobile", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Any additional notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" asChild><Link href="/dispatch">Cancel</Link></Button>
          <Button type="submit" disabled={submitting || !selectedLotId}>
            {submitting ? "Creating..." : "Create Dispatch"}
          </Button>
        </div>
      </form>
    </div>
  );
}


