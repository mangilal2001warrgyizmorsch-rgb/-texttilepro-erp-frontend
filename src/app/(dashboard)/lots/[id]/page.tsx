"use client";
import Link from "next/link";

import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";


const STATUS_COLORS: Record<string, string> = {
  InStorage: "bg-slate-600 text-white",
  InProcess: "bg-amber-600 text-white",
  Finished: "bg-emerald-600 text-white",
  Dispatched: "bg-purple-600 text-white",
};

function LotDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const lot = useQuery(api.lots.get, { id });
  const removeLot = useMutation(api.lots.delete);
  const updateStatus = useMutation(api.lots.updateStatus);

  const handleDelete = async () => {
    if (!confirm("Delete this lot? The challan will revert to Active.")) return;
    try {
      await removeLot({ id });
      toast.success("Lot deleted");
      router.push("/lots");
    } catch {
      toast.error("Failed to delete lot");
    }
  };

  const handleStatusChange = async (status: "InStorage" | "InProcess" | "Finished" | "Dispatched") => {
    try {
      await updateStatus({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (lot === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (lot === null) {
    return <div className="p-6 text-muted-foreground">Lot not found.</div>;
  }

  const nextStatuses: Array<"InStorage" | "InProcess" | "Finished" | "Dispatched"> = ["InStorage", "InProcess", "Finished", "Dispatched"];
  const currentIdx = nextStatuses.indexOf(lot.status);
  const nextStatus = currentIdx < nextStatuses.length - 1 ? nextStatuses[currentIdx + 1] : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/lots">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{lot.lotNo}</h1>
            <Badge className={STATUS_COLORS[lot.status] ?? ""}>{lot.status}</Badge>
            {lot.processType && (
              <Badge variant="outline">{lot.processType}</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{lot.partyName} · {lot.marka}</p>
        </div>
        {lot.status === "InStorage" && (
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 size={18} />
          </Button>
        )}
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div><span className="text-muted-foreground">Party</span><p className="font-semibold text-foreground">{lot.partyName}</p></div>
        <div><span className="text-muted-foreground">Marka</span><p className="font-semibold text-foreground">{lot.marka}</p></div>
        <div><span className="text-muted-foreground">Quality</span><p className="font-semibold text-foreground">{lot.qualityName || "—"}</p></div>
        <div><span className="text-muted-foreground">Process Type</span><p className="font-semibold text-foreground">{lot.processType || "—"}</p></div>
        <div><span className="text-muted-foreground">Total Taka</span><p className="font-semibold text-foreground">{lot.totalTaka}</p></div>
        <div><span className="text-muted-foreground">Total Meter</span><p className="font-semibold text-foreground">{lot.totalMeter}m</p></div>
        <div><span className="text-muted-foreground">Balance Meter</span><p className="font-semibold text-foreground">{lot.balanceMeter}m</p></div>
        {lot.finishedMeter !== undefined && (
          <div><span className="text-muted-foreground">Finished Meter</span><p className="font-semibold text-foreground">{lot.finishedMeter}m</p></div>
        )}
        {lot.shortage !== undefined && (
          <div><span className="text-muted-foreground">Shortage</span><p className="font-semibold text-foreground">{lot.shortage}m</p></div>
        )}
        {lot.locationName && (
          <div><span className="text-muted-foreground">Location</span><p className="font-semibold text-foreground">{lot.locationName}</p></div>
        )}
        <div className="col-span-2">
          <span className="text-muted-foreground">Linked Challan</span>
          <Link href={`/challans/${lot.challanId}`} className="block text-primary font-semibold hover:underline">
            View Challan →
          </Link>
        </div>
      </div>

      {/* Status progression */}
      {nextStatus && (
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">Advance Status</p>
            <p className="text-sm text-muted-foreground">Move this lot to the next stage: <strong>{nextStatus}</strong></p>
          </div>
          {nextStatus === "Dispatched" ? (
            <Button asChild className="shrink-0">
              <Link href={`/dispatch/new?lotId=${lot._id}`}>
                Create Dispatch
              </Link>
            </Button>
          ) : (
            <Button onClick={() => handleStatusChange(nextStatus)} className="shrink-0">
              Move to {nextStatus}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      
      
        {id ? <LotDetailInner id={id as string} /> : <div className="p-6 text-muted-foreground">Invalid lot ID.</div>}
      
    </>
  );
}
