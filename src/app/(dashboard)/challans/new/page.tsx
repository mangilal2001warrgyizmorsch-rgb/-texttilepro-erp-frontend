"use client";

import { useState } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";


export default function NewChallanInner() {
  const router = useRouter();
  const createChallan = useMutation(api.challans.create);

  // Fetch orders that are PendingChallan
  const orders = useQuery(api.orders.list, { status: "PendingChallan" });

  const today = new Date().toISOString().split("T")[0];
  const [challanDate, setChallanDate] = useState(today ?? "");
  const [selectedOrderId, setSelectedOrderId] = useState<string | "">("");
  const [submitting, setSubmitting] = useState(false);

  const selectedOrder = orders?.find((o) => o._id === selectedOrderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedOrder) {
      toast.error("Please select an order");
      return;
    }
    setSubmitting(true);
    try {
      const challanId = await createChallan({
        challanDate,
        orderId: selectedOrderId as string,
        firmId: selectedOrder.firmId,
        firmName: selectedOrder.firmName,
        marka: selectedOrder.marka,
        totalTaka: selectedOrder.totalTaka,
        totalMeter: selectedOrder.totalMeter,
      });
      toast.success("Challan created successfully");
      router.push(`/challans/${challanId._id || challanId}`);
    } catch (err) {
      toast.error("Failed to create challan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/challans">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Party Challan</h1>
          <p className="text-muted-foreground text-sm">Issue a challan against a pending order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Challan Date */}
        <div className="space-y-1.5">
          <Label htmlFor="challanDate">Challan Date *</Label>
          <Input
            id="challanDate"
            type="date"
            value={challanDate}
            onChange={(e) => setChallanDate(e.target.value)}
            required
          />
        </div>

        {/* Select Order */}
        <div className="space-y-1.5">
          <Label>Select Order (PendingChallan) *</Label>
          <Select
            value={selectedOrderId}
            onValueChange={(v) => setSelectedOrderId(v as string)}
          >
            <SelectTrigger>
              <SelectValue placeholder={orders === undefined ? "Loading orders..." : "Select an order"} />
            </SelectTrigger>
            <SelectContent>
              {orders?.length === 0 && (
                <SelectItem value="none" disabled>No pending orders</SelectItem>
              )}
              {orders?.map((order) => (
                <SelectItem key={order._id} value={order._id}>
                  {order.marka} — {order.firmName} — {order.totalTaka} Taka ({order.totalMeter}m)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Order Preview */}
        {selectedOrder && (
          <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold text-foreground mb-2">Order Details</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Firm:</span><span className="text-foreground font-medium">{selectedOrder.firmName}</span>
              <span>Marka:</span><span className="text-foreground font-medium">{selectedOrder.marka}</span>
              <span>Quality:</span><span className="text-foreground font-medium">{selectedOrder.qualityName}</span>
              <span>Total Taka:</span><span className="text-foreground font-medium">{selectedOrder.totalTaka}</span>
              <span>Total Meter:</span><span className="text-foreground font-medium">{selectedOrder.totalMeter}m</span>
              <span>Order Date:</span><span className="text-foreground font-medium">{selectedOrder.orderDate}</span>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting || !selectedOrderId}>
          {submitting ? "Creating..." : "Issue Challan"}
        </Button>
      </form>
    </div>
  );
}


