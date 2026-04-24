"use client";

import { useState } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "sonner";
import { Stamp, CheckCircle2, Circle, CheckCheck } from "lucide-react";
import { format } from "date-fns";



// ─── Order Panel ────────────────────────────────────────────────────────────
function OrderStampPanel({ order }: { order: any }) {
  const stampTaka = useMutation(api.stamping.stampTaka);
  const unstampTaka = useMutation(api.stamping.unstampTaka);
  const stampAll = useMutation(api.stamping.stampAll);
  const [busy, setBusy] = useState<string | null>(null);

  const stamped = order.takaDetails.filter((t) => t.isStamped).length;
  const total = order.takaDetails.length;
  const allDone = stamped === total;

  const handleToggle = async (takaNo: string, isStamped: boolean) => {
    setBusy(takaNo);
    try {
      if (isStamped) {
        await unstampTaka({ orderId: order._id, takaNo });
      } else {
        await stampTaka({ orderId: order._id, takaNo });
        toast.success(`Taka ${takaNo} stamped`);
      }
    } catch {
      toast.error("Failed to update stamp");
    } finally {
      setBusy(null);
    }
  };

  const handleStampAll = async () => {
    try {
      await stampAll({ orderId: order._id });
      toast.success(`All ${total} takas stamped`);
    } catch {
      toast.error("Failed to stamp all");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{order.marka}</span>
            <Badge variant="outline" className="text-xs">{order.qualityName}</Badge>
            <Badge variant="outline" className="text-xs">{order.firmName}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {order.orderDate} · {stamped}/{total} takas stamped
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress pill */}
          <div className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${allDone ? "bg-emerald-500" : stamped > 0 ? "bg-amber-500" : "bg-slate-400"}`}
            />
            {allDone ? "All Stamped" : stamped > 0 ? "Partial" : "Unstamped"}
          </div>
          {!allDone && (
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={handleStampAll}>
              <CheckCheck size={13} />
              Stamp All
            </Button>
          )}
        </div>
      </div>

      {/* Taka Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {order.takaDetails.map((taka) => {
          const isBusy = busy === taka.takaNo;
          return (
            <button
              key={taka.takaNo}
              disabled={isBusy}
              onClick={() => handleToggle(taka.takaNo, taka.isStamped)}
              className={`
                relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer
                ${taka.isStamped
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                }
                ${isBusy ? "opacity-50" : ""}
              `}
            >
              {taka.isStamped
                ? <CheckCircle2 size={18} className="text-emerald-500" />
                : <Circle size={18} />
              }
              <span>{taka.takaNo}</span>
              <span className="text-xs text-muted-foreground">{taka.meter}m</span>
              {taka.isStamped && taka.stampedAt && (
                <span className="text-[10px] text-muted-foreground/60">
                  {format(new Date(taka.stampedAt), "HH:mm")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StampingInner() {
  const [search, setSearch] = useState("");
  const orders = useQuery(api.stamping.listStampable, {});

  const filtered = orders?.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.marka.toLowerCase().includes(q) ||
      o.firmName.toLowerCase().includes(q) ||
      o.qualityName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stamping</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mark individual takas as stamped before sending to process
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Search by marka, party, quality…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {orders === undefined ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Stamp /></EmptyMedia>
            <EmptyTitle>No orders to stamp</EmptyTitle>
            <EmptyDescription>
              Orders with status ChallanIssued, LotCreated, or InProcess appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {filtered?.map((order) => (
            <OrderStampPanel key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}


