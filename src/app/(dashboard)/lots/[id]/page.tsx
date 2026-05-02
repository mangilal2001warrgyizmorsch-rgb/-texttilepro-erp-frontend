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
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 text-sm">
        <div>
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Lot No.</span>
          <p className="font-bold text-lg text-foreground">{lot.lotNo}</p>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Party Name</span>
          <p className="font-bold text-lg text-foreground">{lot.partyName}</p>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Party Ch No.</span>
          <p className="font-bold text-lg text-foreground">{lot.orderId?.weaverChNo || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Party Challan Date</span>
          <p className="font-bold text-lg text-foreground">{lot.orderId?.weaverChDate || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Quality</span>
          <p className="font-bold text-lg text-foreground">{lot.qualityName || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Weaver Ka Name</span>
          <p className="font-bold text-lg text-foreground">{lot.orderId?.weaverName || "—"}</p>
        </div>
        
        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Total Taka</span>
          <p className="font-bold text-lg text-foreground">{lot.totalTaka}</p>
        </div>
        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Total Meter</span>
          <p className="font-bold text-lg text-emerald-600">{lot.totalMeter}m</p>
        </div>
        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Balance Meter</span>
          <p className="font-bold text-lg text-primary">{lot.balanceMeter}m</p>
        </div>

        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Grey Rate</span>
          <p className="font-bold text-lg text-foreground">₹{lot.orderId?.greyRate || "0"}</p>
        </div>
        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Grey Amount</span>
          <p className="font-bold text-lg text-primary">₹{(lot.totalMeter * (lot.orderId?.greyRate || 0)).toLocaleString()}</p>
        </div>
        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Weight</span>
          <p className="font-bold text-lg text-foreground">{lot.orderId?.weight || "—"}</p>
        </div>

        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Width</span>
          <p className="font-bold text-lg text-foreground">{lot.orderId?.width || "—"}</p>
        </div>
        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Length</span>
          <p className="font-bold text-lg text-foreground">{lot.orderId?.length || "—"}</p>
        </div>
        <div className="border-t pt-4">
          <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Chaldti</span>
          <p className="font-bold text-lg text-foreground">{lot.orderId?.chadhti || "—"}</p>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t pt-4 flex gap-6">
          <div>
            <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Linked Challan</span>
            <Link href={`/challans/${lot.challanId?._id || lot.challanId}`} className="text-primary font-bold hover:underline">
              View Challan →
            </Link>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-1">Linked Order</span>
            <Link href={`/orders/${lot.orderId?._id || lot.orderId}`} className="text-primary font-bold hover:underline">
              View Order →
            </Link>
          </div>
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
