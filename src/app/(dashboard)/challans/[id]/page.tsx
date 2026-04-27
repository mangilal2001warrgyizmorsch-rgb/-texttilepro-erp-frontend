"use client";
import Link from "next/link";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import { ArrowLeft, Layers, Trash2 } from "lucide-react";
import { format } from "date-fns";

function ChallanDetailInner({ id }: { id: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: challan, isLoading: challanLoading } = useQuery({
    queryKey: ["challan", id],
    queryFn: () => api.get<any>(`/challans/${id}`),
  });
  const { data: order } = useQuery({
    queryKey: ["order", challan?.orderId],
    queryFn: () => api.get<any>(`/orders/${challan.orderId}`),
    enabled: !!challan?.orderId,
  });
  const { data: lots } = useQuery({
    queryKey: ["lots", "challan", id],
    queryFn: () => api.get<any[]>(`/lots/by-challan/${id}`).catch(() => []),
  });

  const handleDelete = async () => {
    if (!confirm("Delete this challan? The order will revert to Draft."))
      return;
    try {
      await api.delete(`/challans/${id}`);
      qc.invalidateQueries({ queryKey: ["challan"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Challan deleted");
      router.push("/challans");
    } catch {
      toast.error("Failed to delete challan");
    }
  };

  if (challanLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (challan === null) {
    return <div className="p-6 text-muted-foreground">Challan not found.</div>;
  }

  const canCreateLot =
    challan.status === "Active" && (!lots || lots.length === 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/challans">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              {challan.challan_no || challan.challanNo}
            </h1>
            <Badge
              className={
                challan.status === "Active"
                  ? "bg-blue-600 text-white"
                  : "bg-emerald-600 text-white"
              }
            >
              {challan.status === "LotCreated" ? "Lot Created" : challan.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {challan.challan_date || challan.date
              ? (() => {
                  const d = new Date(challan.challan_date || challan.date);
                  return isNaN(d.getTime())
                    ? challan.challan_date || challan.date
                    : format(d, "dd MMM yyyy");
                })()
              : ""}
          </p>
        </div>
        {challan.status === "Active" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={18} />
          </Button>
        )}
      </div>

      {/* Challan Details */}
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">Party / Firm</span>
          <p className="font-semibold text-foreground">
            {challan.firm || challan.firmName}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Marka</span>
          <p className="font-semibold text-foreground">
            {challan.party || challan.marka}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Total Taka</span>
          <p className="font-semibold text-foreground">
            {challan.taka || challan.totalTaka}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Total Meter</span>
          <p className="font-semibold text-foreground">
            {challan.meter || challan.totalMeter}m
          </p>
        </div>
        {order && (
          <>
            <div>
              <span className="text-muted-foreground">Quality</span>
              <p className="font-semibold text-foreground">
                {order.qualityName}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Order Date</span>
              <p className="font-semibold text-foreground">{order.orderDate}</p>
            </div>
          </>
        )}
        <div className="col-span-2">
          <span className="text-muted-foreground">Linked Order</span>
          <Link
            href={`/orders/${challan.orderId}`}
            className="block text-primary font-semibold hover:underline"
          >
            View Order →
          </Link>
        </div>
      </div>

      {/* Create Lot CTA */}
      {canCreateLot && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">
              Ready for Lot Creation
            </p>
            <p className="text-sm text-muted-foreground">
              This challan is active. Create a lot to begin processing.
            </p>
          </div>
          <Link href={`/lots/new?challanId=${challan._id}`}>
            <Button className="gap-2 shrink-0">
              <Layers size={16} />
              Create Lot
            </Button>
          </Link>
        </div>
      )}

      {/* Lots */}
      {lots && lots.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Lots</h2>
          {lots.map((lot) => (
            <Link key={lot._id} href={`/lots/${lot._id}`}>
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors">
                <div>
                  <p className="font-semibold text-foreground">{lot.lotNo}</p>
                  <p className="text-sm text-muted-foreground">
                    {lot.totalTaka} Taka · {lot.totalMeter}m · Balance:{" "}
                    {lot.balanceMeter}m
                  </p>
                </div>
                <Badge variant="secondary">{lot.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      {id ? (
        <ChallanDetailInner id={id as string} />
      ) : (
        <div className="p-6 text-muted-foreground">Invalid challan ID.</div>
      )}
    </>
  );
}
