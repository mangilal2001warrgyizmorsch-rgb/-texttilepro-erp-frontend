"use client";
import Link from "next/link";

import { useState } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Trash2, BarChart2 } from "lucide-react";
import { format } from "date-fns";


const STATUS_COLORS: Record<string, string> = {
  Open: "bg-slate-600 text-white",
  InProgress: "bg-amber-600 text-white",
  Completed: "bg-emerald-600 text-white",
};

// ─── Production Update Panel ─────────────────────────────────────────────────
function ProductionUpdatePanel({
  id,
  inputMeter,
}: {
  id: string;
  inputMeter: number;
}) {
  const [finishedMeter, setFinishedMeter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const recordProduction = useMutation(api.jobCards.recordProduction);

  const shortage = finishedMeter
    ? (inputMeter - Number(finishedMeter)).toFixed(2)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishedMeter || Number(finishedMeter) <= 0) {
      toast.error("Enter a valid finished meter value");
      return;
    }
    setSubmitting(true);
    try {
      await recordProduction({ id, finishedMeter: Number(finishedMeter) });
      toast.success("Production recorded — lot marked as Finished");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record production");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <BarChart2 size={18} className="text-amber-600" />
        <p className="font-semibold text-foreground">Record Production Output</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Input Meter</span>
          <p className="font-semibold text-foreground">{inputMeter}m</p>
        </div>
        {shortage !== null && (
          <div>
            <span className="text-muted-foreground">Shortage</span>
            <p className={`font-semibold ${Number(shortage) > 0 ? "text-red-500" : "text-emerald-600"}`}>
              {shortage}m
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="finishedMeter">Finished Meter *</Label>
        <Input
          id="finishedMeter"
          type="number"
          min={0}
          step={0.01}
          value={finishedMeter}
          onChange={(e) => setFinishedMeter(e.target.value)}
          placeholder="Enter actual output meters"
          required
        />
      </div>

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" disabled={submitting}>
        <CheckCircle2 size={16} />
        {submitting ? "Saving…" : "Save Production Update"}
      </Button>
    </form>
  );
}

// ─── Detail Page ─────────────────────────────────────────────────────────────
function JobCardDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const jc = useQuery(api.jobCards.get, { id });
  const removeJc = useMutation(api.jobCards.delete);

  const handleDelete = async () => {
    if (!confirm("Delete this job card?")) return;
    try {
      await removeJc({ id });
      toast.success("Job card deleted");
      router.push("/job-cards");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (jc === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (!jc) return <div className="p-6 text-muted-foreground">Job card not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/job-cards">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{jc.jobCardNo}</h1>
            <Badge className={STATUS_COLORS[jc.status]}>
              {jc.status === "InProgress" ? "In Progress" : jc.status}
            </Badge>
            <Badge variant="outline">{jc.processType}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{format(new Date(jc.jobCardDate), "dd MMM yyyy")}</p>
        </div>
        {jc.status !== "Completed" && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
          </Button>
        )}
      </div>

      {/* Core info */}
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
        {[
          ["Party", jc.partyName],
          ["Marka", jc.marka],
          ["Quality", jc.qualityName || "—"],
          ["Process Type", jc.processType],
          ["Input Meter", `${jc.inputMeter}m`],
          ["Machine No", jc.machineNo ?? "—"],
          ["Operator", jc.operatorName ?? "—"],
          ["Temperature", jc.temperature ? `${jc.temperature}°C` : "—"],
          ["Duration", jc.duration ?? "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="text-muted-foreground">{label}</span>
            <p className="font-semibold text-foreground">{value}</p>
          </div>
        ))}
        {jc.notes && (
          <div className="col-span-2 sm:col-span-3">
            <span className="text-muted-foreground">Notes</span>
            <p className="font-semibold text-foreground">{jc.notes}</p>
          </div>
        )}
        <div className="col-span-2 sm:col-span-3">
          <span className="text-muted-foreground">Linked Lot</span>
          <Link href={`/lots/${jc.lotId}`} className="block text-primary font-semibold hover:underline">
            {jc.lotNo} →
          </Link>
        </div>
      </div>

      {/* Colour Recipe */}
      {jc.colorRecipe.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="font-semibold text-foreground">Colour Recipe</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted-foreground font-medium pb-2">Colour</th>
                  <th className="text-left text-muted-foreground font-medium pb-2">Shade</th>
                  <th className="text-right text-muted-foreground font-medium pb-2">Qty</th>
                  <th className="text-right text-muted-foreground font-medium pb-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {jc.colorRecipe.map((c, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 font-medium text-foreground">{c.colorName}</td>
                    <td className="py-1.5 text-muted-foreground">{c.shade ?? "—"}</td>
                    <td className="py-1.5 text-right">{c.quantity}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{c.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chemicals */}
      {jc.chemicals.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="font-semibold text-foreground">Chemicals Used</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted-foreground font-medium pb-2">Chemical</th>
                  <th className="text-right text-muted-foreground font-medium pb-2">Qty</th>
                  <th className="text-right text-muted-foreground font-medium pb-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {jc.chemicals.map((c, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 font-medium text-foreground">{c.chemName}</td>
                    <td className="py-1.5 text-right">{c.quantity}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{c.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Production Output — shown when completed */}
      {jc.status === "Completed" && jc.finishedMeter !== undefined && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Finished Meter</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{jc.finishedMeter}m</p>
          </div>
          <div>
            <span className="text-muted-foreground">Shortage</span>
            <p className={`text-xl font-bold ${(jc.shortage ?? 0) > 0 ? "text-red-500" : "text-emerald-600"}`}>
              {jc.shortage?.toFixed(2) ?? 0}m
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Completed At</span>
            <p className="font-semibold text-foreground text-xs mt-1">
              {jc.completedAt ? format(new Date(jc.completedAt), "dd MMM yyyy HH:mm") : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Production Update form — only when not completed */}
      {jc.status !== "Completed" && (
        <ProductionUpdatePanel id={id} inputMeter={jc.inputMeter} />
      )}
    </div>
  );
}

export default function JobCardDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      
      
        {id
          ? <JobCardDetailInner id={id as string} />
          : <div className="p-6 text-muted-foreground">Invalid ID.</div>
        }
      
    </>
  );
}
