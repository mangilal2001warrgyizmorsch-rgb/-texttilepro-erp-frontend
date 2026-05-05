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
import { Plus, Search, Truck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type StatusFilter = "all" | "Pending" | "Dispatched" | "Billed";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Dispatched: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Billed: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function ReadyForDispatchPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Use lots list for "Ready for Dispatch" view
  const lots = useQuery(api.lots.list, { status: "Finished" });
  const dispatches = useQuery(api.dispatches.list, {});

  const data = filter === "Pending" ? (lots ?? []) : (dispatches ?? []);

  const filtered = data.filter((d: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.dispatchNo?.toLowerCase().includes(q) || "") ||
      d.partyName.toLowerCase().includes(q) ||
      d.marka.toLowerCase().includes(q) ||
      d.lotNo.toLowerCase().includes(q)
    );
  });

  const statusTabs: StatusFilter[] = ["all", "Pending", "Dispatched", "Billed"];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Ready for Dispatch</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Manage lots ready to be sent to parties</p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/dispatch/new">
            <Truck className="w-4 h-4 mr-2" />
            Ready for Dispatch
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search party, marka, lot..."
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
      {data === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Truck /></EmptyMedia>
            <EmptyTitle>No records found</EmptyTitle>
            <EmptyDescription>All finished lots appear here for dispatching.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-muted/30 whitespace-nowrap">
                <TableRow>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Master Name</TableHead>
                  <TableHead>Marka</TableHead>
                  <TableHead>Lot No</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead className="text-right">Taka</TableHead>
                  <TableHead className="text-right">Meter</TableHead>
                  {filter !== "Pending" && <TableHead>Status</TableHead>}
                </TableRow>
              </TableHeader>
            <TableBody>
              {filtered.map((d: any) => (
                <TableRow key={d._id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{d.partyName}</TableCell>
                  <TableCell>{d.masterName || "-"}</TableCell>
                  <TableCell>{d.marka}</TableCell>
                  <TableCell className="font-mono text-primary font-bold">{d.lotNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{d.qualityName}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{d.totalTaka || d.noBales || "-"}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {(d.finishedMeter || d.totalMeter || 0).toLocaleString()}m
                  </TableCell>
                  {filter !== "Pending" && (
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[d.status || "Pending"]}>
                        {d.status || "Pending"}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      )}
    </div>
  );
}
