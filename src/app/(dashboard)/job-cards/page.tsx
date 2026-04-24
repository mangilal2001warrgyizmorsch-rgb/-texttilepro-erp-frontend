"use client";
import Link from "next/link";

import { useState } from "react";
import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Plus, ClipboardList } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-slate-600 text-white",
  InProgress: "bg-amber-600 text-white",
  Completed: "bg-emerald-600 text-white",
};

export default function JobCardsInner() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"Open" | "InProgress" | "Completed" | undefined>(undefined);
  const jobCards = useQuery(api.jobCards.list, { status: statusFilter });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Cards</h1>
          <p className="text-muted-foreground text-sm mt-1">Production job cards with colour recipe and chemical usage</p>
        </div>
        <Button className="gap-2" onClick={() => router.push("/job-cards/new")}>
          <Plus size={16} />New Job Card
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["All", "Open", "InProgress", "Completed"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === (s === "All" ? undefined : s) ? "default" : "ghost"}
            onClick={() => setStatusFilter(s === "All" ? undefined : s)}
          >
            {s === "InProgress" ? "In Progress" : s}
          </Button>
        ))}
      </div>

      {jobCards === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : jobCards.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><ClipboardList /></EmptyMedia>
            <EmptyTitle>No job cards yet</EmptyTitle>
            <EmptyDescription>Create a job card from a lot in process to track production.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {jobCards.map((jc) => (
            <Link key={jc._id} href={`/job-cards/${jc._id}`}>
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-semibold text-foreground">{jc.jobCardNo}</span>
                    <Badge className={STATUS_COLORS[jc.status]}>{jc.status === "InProgress" ? "In Progress" : jc.status}</Badge>
                    <Badge variant="outline" className="text-xs">{jc.processType}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                    <span>{jc.partyName}</span>
                    <span>Marka: <strong className="text-foreground">{jc.marka}</strong></span>
                    <span>{jc.lotNo}</span>
                    <span>{jc.inputMeter}m input</span>
                    {jc.finishedMeter !== undefined && (
                      <span className="text-emerald-600 dark:text-emerald-400">{jc.finishedMeter}m finished</span>
                    )}
                    {jc.machineNo && <span>Machine: {jc.machineNo}</span>}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground whitespace-nowrap shrink-0">
                  {format(new Date(jc.jobCardDate), "dd MMM yyyy")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


