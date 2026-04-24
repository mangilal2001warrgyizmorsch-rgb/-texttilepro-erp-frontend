"use client";
import Link from "next/link";

import { useState } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "sonner";
import { Send, Plus, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


// ─── New Process Issue Form ───────────────────────────────────────────────────
function NewProcessIssueDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const lots = useQuery(api.lots.list, { status: "InStorage" });
  const createIssue = useMutation(api.processIssues.create);

  const today = new Date().toISOString().split("T")[0] ?? "";
  const [issueDate, setIssueDate] = useState(today);
  const [selectedLotId, setSelectedLotId] = useState<string | "">("");
  const [machineNo, setMachineNo] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedLot = lots?.find((l) => l._id === selectedLotId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !selectedLot) return;
    if (!selectedLot.processType) {
      toast.error("Lot has no process type set. Edit the lot first.");
      return;
    }
    setSubmitting(true);
    try {
      const id = await createIssue({
        issueDate,
        lotId: selectedLotId as string,
        lotNo: selectedLot.lotNo,
        orderId: selectedLot.orderId,
        partyName: selectedLot.partyName,
        marka: selectedLot.marka,
        qualityName: selectedLot.qualityName,
        processType: selectedLot.processType,
        totalMeter: selectedLot.balanceMeter,
        machineNo: machineNo || undefined,
        operatorName: operatorName || undefined,
        remarks: remarks || undefined,
      });
      toast.success("Process Issue created");
      onClose();
      router.push(`/process-issue/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create issue";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Lot to Process</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Issue Date *</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Select Lot (InStorage) *</Label>
            <Select
              value={selectedLotId}
              onValueChange={(v) => setSelectedLotId(v as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder={lots === undefined ? "Loading…" : "Select a lot"} />
              </SelectTrigger>
              <SelectContent>
                {lots?.length === 0 && (
                  <SelectItem value="none" disabled>No lots in storage</SelectItem>
                )}
                {lots?.map((l) => (
                  <SelectItem key={l._id} value={l._id}>
                    {l.lotNo} — {l.partyName} — {l.marka} ({l.balanceMeter}m)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLot && (
            <div className="bg-muted/40 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Process Type</span>
              <span className="font-medium text-foreground">{selectedLot.processType ?? "Not set"}</span>
              <span className="text-muted-foreground">Meter to Process</span>
              <span className="font-medium text-foreground">{selectedLot.balanceMeter}m</span>
              <span className="text-muted-foreground">Quality</span>
              <span className="font-medium text-foreground">{selectedLot.qualityName || "—"}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Machine No</Label>
              <Input value={machineNo} onChange={(e) => setMachineNo(e.target.value)} placeholder="M-01" />
            </div>
            <div className="space-y-1.5">
              <Label>Operator Name</Label>
              <Input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} placeholder="Raju" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes…" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={submitting || !selectedLotId}>
              {submitting ? "Creating…" : "Issue to Process"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main List Page ───────────────────────────────────────────────────────────
export default function ProcessIssueInner() {
  const [statusFilter, setStatusFilter] = useState<"Issued" | "Completed" | undefined>(undefined);
  const [showNew, setShowNew] = useState(false);
  const issues = useQuery(api.processIssues.list, { status: statusFilter });
  const completeIssue = useMutation(api.processIssues.complete);
  const removeIssue = useMutation(api.processIssues.delete);

  const handleComplete = async (id: string) => {
    try {
      await completeIssue({ id });
      toast.success("Marked as completed");
    } catch {
      toast.error("Failed to complete");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this process issue? The lot will revert to InStorage.")) return;
    try {
      await removeIssue({ id });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Send to Process</h1>
          <p className="text-muted-foreground text-sm mt-1">Issue lots for dyeing or printing process</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNew(true)}>
          <Plus size={16} />New Issue
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {(["All", "Issued", "Completed"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === (s === "All" ? undefined : s) ? "default" : "ghost"}
            onClick={() => setStatusFilter(s === "All" ? undefined : s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {issues === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : issues.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Send /></EmptyMedia>
            <EmptyTitle>No process issues</EmptyTitle>
            <EmptyDescription>Issue lots to the dyeing or printing process to start production.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue._id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
              <Link href={`/process-issue/${issue._id}`} className="flex-1 min-w-0 cursor-pointer group">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{issue.issueNo}</span>
                  <Badge className={issue.status === "Issued" ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}>
                    {issue.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{issue.processType}</Badge>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span>{issue.partyName}</span>
                  <span>Marka: <strong className="text-foreground">{issue.marka}</strong></span>
                  <span>{issue.lotNo}</span>
                  <span>{issue.totalMeter}m</span>
                  {issue.machineNo && <span>Machine: {issue.machineNo}</span>}
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(issue.issueDate), "dd MMM yyyy")}
                </span>
                {issue.status === "Issued" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-emerald-600 hover:text-emerald-700"
                    onClick={() => handleComplete(issue._id)}
                  >
                    <CheckCircle size={14} />
                    Complete
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(issue._id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewProcessIssueDialog open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}


