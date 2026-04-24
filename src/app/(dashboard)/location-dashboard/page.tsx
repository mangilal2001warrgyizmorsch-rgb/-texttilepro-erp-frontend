"use client";

import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";


import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MapPin, Package, Layers, AlertTriangle } from "lucide-react";

type Section = "GreyArea" | "ProcessingArea" | "FinishedArea";

const SECTION_LABELS: Record<Section, string> = {
  GreyArea: "Grey Area",
  ProcessingArea: "Processing Area",
  FinishedArea: "Finished Area",
};

const SECTION_COLORS: Record<Section, { bg: string; bar: string; icon: string }> = {
  GreyArea: {
    bg: "bg-slate-600/10 border-slate-600/20",
    bar: "bg-slate-500",
    icon: "text-slate-500",
  },
  ProcessingArea: {
    bg: "bg-amber-600/10 border-amber-600/20",
    bar: "bg-amber-500",
    icon: "text-amber-500",
  },
  FinishedArea: {
    bg: "bg-emerald-600/10 border-emerald-600/20",
    bar: "bg-emerald-500",
    icon: "text-emerald-500",
  },
};

const STATUS_DOT: Record<string, string> = {
  Empty: "bg-emerald-500",
  Partial: "bg-amber-500",
  Full: "bg-red-500",
};

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
      </div>
    </div>
  );
}

export default function LocationDashboardInner() {
  const stats = useQuery(api.locations.getDashboardStats, {});
  const locations = useQuery(api.locations.list, {});
  const lots = useQuery(api.lots.list, {});

  if (stats === undefined || locations === undefined || lots === undefined) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const utilPct = stats.totalCapacity > 0
    ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100)
    : 0;

  const fullLocations = locations.filter((l) => l.status === "Full");
  const lotsInStorage = lots.filter((l) => l.status === "InStorage");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Location Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time warehouse utilisation overview</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Locations" value={stats.totalLocations} icon={<MapPin size={18} />} />
        <StatCard label="Total Capacity" value={`${stats.totalCapacity}m`} icon={<Package size={18} />} />
        <StatCard label="Occupied" value={`${stats.totalOccupied}m`} sub={`${utilPct}% utilised`} icon={<Layers size={18} />} />
        <StatCard label="Full Locations" value={fullLocations.length} sub="Need attention" icon={<AlertTriangle size={18} />} />
      </div>

      {/* Overall utilisation bar */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-foreground">Overall Warehouse Utilisation</p>
          <span className="text-sm font-bold text-foreground">{utilPct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${utilPct >= 90 ? "bg-red-500" : utilPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${utilPct}%` }}
          />
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Empty ({stats.empty})</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Partial ({stats.partial})</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Full ({stats.full})</span>
        </div>
      </div>

      {/* Section Breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {(["GreyArea", "ProcessingArea", "FinishedArea"] as const).map((section) => {
          const s = stats.bySection[section];
          const pct = s.capacity > 0 ? Math.round((s.occupied / s.capacity) * 100) : 0;
          const colors = SECTION_COLORS[section];
          return (
            <div key={section} className={`border rounded-xl p-5 space-y-3 ${colors.bg}`}>
              <div className="flex justify-between items-center">
                <p className="font-semibold text-foreground">{SECTION_LABELS[section]}</p>
                <span className="text-xs text-muted-foreground">{s.count} locations</span>
              </div>
              <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{s.occupied}m used</span>
                <span className="font-medium text-foreground">{s.capacity}m total · {pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Location Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All Locations</h2>
          <Link href="/locations" className="text-sm text-primary hover:underline">Manage →</Link>
        </div>

        {locations.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            No locations configured. <Link href="/locations" className="text-primary hover:underline">Add locations →</Link>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {locations.map((loc) => {
              const pct = loc.capacityMeter > 0
                ? Math.min(100, Math.round((loc.occupiedMeter / loc.capacityMeter) * 100))
                : 0;
              const sectionColors = SECTION_COLORS[loc.section];
              const lotsHere = lotsInStorage.filter((l) => l.locationId === loc._id);
              return (
                <div key={loc._id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[loc.status]}`} />
                      <span className="font-medium text-sm text-foreground">{loc.locationId}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs py-0">{SECTION_LABELS[loc.section]}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{loc.warehouseName}</p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sectionColors.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{loc.occupiedMeter}/{loc.capacityMeter}m</span>
                    {lotsHere.length > 0 && (
                      <span className="text-primary">{lotsHere.length} lot{lotsHere.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lots in Storage */}
      {lotsInStorage.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Lots Currently In Storage</h2>
          <div className="space-y-2">
            {lotsInStorage.map((lot) => (
              <Link key={lot._id} href={`/lots/${lot._id}`}>
                <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{lot.lotNo}</p>
                    <p className="text-xs text-muted-foreground">{lot.partyName} · {lot.marka} · {lot.qualityName || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{lot.balanceMeter}m</p>
                    <p className="text-xs text-muted-foreground">{lot.locationName ?? "No location"}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


