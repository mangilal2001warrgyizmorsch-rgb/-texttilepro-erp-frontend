"use client";

import { useState, useEffect } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";


export default function NewLotInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledChallanId = searchParams.get("challanId");

  const createLot = useMutation(api.lots.create);

  // Fetch challans that are Active (not yet converted to lot)
  const challans = useQuery(api.challans.list, { status: "Active" });

  const [selectedChallanId, setSelectedChallanId] = useState<string | "">(
    prefilledChallanId as string | "" ?? ""
  );
  const [processType, setProcessType] = useState<"Dyeing" | "Printing" | "Both">("Dyeing");
  const [submitting, setSubmitting] = useState(false);

  const selectedChallan = challans?.find((c) => c._id === selectedChallanId);

  // Pre-fill when challans load and prefilled ID present
  useEffect(() => {
    if (prefilledChallanId && challans && !selectedChallanId) {
      setSelectedChallanId(prefilledChallanId as string);
    }
  }, [challans, prefilledChallanId, selectedChallanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallanId || !selectedChallan) {
      toast.error("Please select a challan");
      return;
    }
    setSubmitting(true);
    try {
      const lot = await createLot({
        challanId: selectedChallanId as string,
        orderId: selectedChallan.orderId,
        partyId: selectedChallan.firmId,
        partyName: selectedChallan.firmName,
        marka: selectedChallan.marka,
        qualityName: "",           // Will be filled from order
        totalTaka: selectedChallan.totalTaka,
        totalMeter: selectedChallan.totalMeter,
        processType,
      });
      toast.success("Lot created successfully");
      router.push(`/lots/${lot._id || lot}`);
    } catch (err) {
      toast.error("Failed to create lot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lots">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Lot</h1>
          <p className="text-muted-foreground text-sm">Convert a challan into a production lot</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Select Challan */}
        <div className="space-y-1.5">
          <Label>Select Active Challan *</Label>
          <Select
            value={selectedChallanId}
            onValueChange={(v) => setSelectedChallanId(v as string)}
          >
            <SelectTrigger>
              <SelectValue placeholder={challans === undefined ? "Loading..." : "Select a challan"} />
            </SelectTrigger>
            <SelectContent>
              {challans?.length === 0 && (
                <SelectItem value="none" disabled>No active challans available</SelectItem>
              )}
              {challans?.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.challanNo} — {c.firmName} — {c.marka}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Challan Preview */}
        {selectedChallan && (
          <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold text-foreground mb-2">Challan Details</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Challan No:</span><span className="text-foreground font-medium">{selectedChallan.challanNo}</span>
              <span>Party:</span><span className="text-foreground font-medium">{selectedChallan.firmName}</span>
              <span>Marka:</span><span className="text-foreground font-medium">{selectedChallan.marka}</span>
              <span>Total Taka:</span><span className="text-foreground font-medium">{selectedChallan.totalTaka}</span>
              <span>Total Meter:</span><span className="text-foreground font-medium">{selectedChallan.totalMeter}m</span>
            </div>
          </div>
        )}

        {/* Process Type */}
        <div className="space-y-1.5">
          <Label>Process Type *</Label>
          <Select value={processType} onValueChange={(v) => setProcessType(v as "Dyeing" | "Printing" | "Both")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dyeing">Dyeing</SelectItem>
              <SelectItem value="Printing">Printing</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={submitting || !selectedChallanId}>
          {submitting ? "Creating Lot..." : "Create Lot"}
        </Button>
      </form>
    </div>
  );
}

// Re-export Input to suppress unused import warning
export { Input };


