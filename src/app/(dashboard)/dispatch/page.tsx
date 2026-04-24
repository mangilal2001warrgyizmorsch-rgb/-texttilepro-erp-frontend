"use client";

import { useState } from "react";
import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Plus, Search, Truck } from "lucide-react";
import { format } from "date-fns";

type StatusFilter = "all" | "Pending" | "Dispatched" | "Billed";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Dispatched: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Billed: "bg-green-500/20 text-green-400 border-green-500/30",
};

function DispatchListInner() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const dispatches = useQuery(
    api.dispatches.list,
    filter === "all" ? {} : { status: filter }
  );

  const filtered = (dispatches ?? []).filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.dispatchNo.toLowerCase().includes(q) ||
      d.partyName.toLowerCase().includes(q) ||
      d.marka.toLowerCase().includes(q) ||
      d.lotNo.toLowerCase().includes(q)
    );
  });

  const statusTabs: StatusFilter[] = ["all", "Pending", "Dispatched", "Billed"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage finished lot dispatches</p>
        </div>
        <Button asChild>
          <Link href="/dispatch/new">
            <Plus className="w-4 h-4 mr-2" />
            New Dispatch
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search dispatch no, party, marka..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter(s)}
              className="capitalize cursor-pointer"
            >
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {dispatches === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Truck /></EmptyMedia>
            <EmptyTitle>No dispatches found</EmptyTitle>
            <EmptyDescription>Create a new dispatch from a finished lot.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Dispatch No</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Party</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Lot</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Marka</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Meter</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Mode</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d._id} className={`border-t border-border hover:bg-muted/20 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3">
                    <Link href={`/dispatch/${d._id}`} className="font-mono text-primary hover:underline">{d.dispatchNo}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(d.dispatchDate), "dd/MM/yyyy")}</td>
                  <td className="px-4 py-3 font-medium">{d.partyName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.lotNo}</td>
                  <td className="px-4 py-3">{d.marka}</td>
                  <td className="px-4 py-3 text-right">{d.finishedMeter.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{d.shippingMode}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={STATUS_COLORS[d.status]}>{d.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DispatchListPage() {
  return (
    
      <DispatchListInner />
    
  );
}
