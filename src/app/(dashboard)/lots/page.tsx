"use client";

import { useState } from "react";
import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Layers } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  InStorage: "bg-slate-600 text-white",
  InProcess: "bg-amber-600 text-white",
  Finished: "bg-emerald-600 text-white",
  Dispatched: "bg-purple-600 text-white",
};

export default function LotsListInner() {
  const [statusFilter, setStatusFilter] = useState<"InStorage" | "InProcess" | "Finished" | "Dispatched" | undefined>(undefined);
  const lots = useQuery(api.lots.list, { status: statusFilter });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lots</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all production lots created from challans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["All", "InStorage", "InProcess", "Finished", "Dispatched"] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === (s === "All" ? undefined : s) ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(s === "All" ? undefined : s)}
          >
            {s === "InStorage" ? "In Storage" : s === "InProcess" ? "In Process" : s}
          </Button>
        ))}
      </div>

      {lots === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : lots.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Layers /></EmptyMedia>
            <EmptyTitle>No lots found</EmptyTitle>
            <EmptyDescription>Create a lot from a challan to start tracking production.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => (
            <Link key={lot._id} href={`/lots/${lot._id}`}>
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-semibold text-foreground">{lot.lotNo}</span>
                    <Badge className={STATUS_COLORS[lot.status] ?? ""}>{lot.status}</Badge>
                    {lot.processType && (
                      <Badge variant="outline" className="text-xs">{lot.processType}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                    <span>{lot.partyName}</span>
                    <span>Marka: <strong className="text-foreground">{lot.marka}</strong></span>
                    <span>{lot.qualityName}</span>
                    <span>{lot.totalTaka} Taka · {lot.totalMeter}m</span>
                    <span>Balance: <strong className="text-foreground">{lot.balanceMeter}m</strong></span>
                  </div>
                </div>
                {lot.locationName && (
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    📍 {lot.locationName}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


