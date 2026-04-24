"use client";

import { useState } from "react";
import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { FileText, Plus } from "lucide-react";
import { format } from "date-fns";

export default function ChallansListInner() {
  const [statusFilter, setStatusFilter] = useState<"Active" | "LotCreated" | undefined>(undefined);
  const challans = useQuery(api.challans.list, { status: statusFilter });

  const statusBadge = (status: string) => {
    if (status === "Active") return <Badge className="bg-blue-600 text-white">Active</Badge>;
    if (status === "LotCreated") return <Badge className="bg-emerald-600 text-white">Lot Created</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Party Challans</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage party challans issued against orders</p>
        </div>
        <Link href="/challans/new">
          <Button className="gap-2">
            <Plus size={16} />
            New Challan
          </Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(["All", "Active", "LotCreated"] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === (s === "All" ? undefined : s) ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(s === "All" ? undefined : s)}
          >
            {s === "LotCreated" ? "Lot Created" : s}
          </Button>
        ))}
      </div>

      {challans === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : challans.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText /></EmptyMedia>
            <EmptyTitle>No challans found</EmptyTitle>
            <EmptyDescription>Issue a party challan from an order to get started.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {challans.map((challan) => (
            <Link key={challan._id} href={`/challans/${challan._id}`}>
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-foreground">{challan.challanNo}</span>
                    {statusBadge(challan.status)}
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                    <span>{challan.firmName}</span>
                    <span>Marka: <strong className="text-foreground">{challan.marka}</strong></span>
                    <span>{challan.totalTaka} Taka · {challan.totalMeter}m</span>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(challan.challanDate), "dd MMM yyyy")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


