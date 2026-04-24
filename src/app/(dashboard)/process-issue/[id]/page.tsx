"use client";
import Link from "next/link";

import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";


function ProcessIssueDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const issue = useQuery(api.processIssues.get, { id });
  const completeIssue = useMutation(api.processIssues.complete);
  const removeIssue = useMutation(api.processIssues.delete);

  const handleComplete = async () => {
    try {
      await completeIssue({ id });
      toast.success("Marked as completed");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this process issue? The lot will revert to InStorage.")) return;
    try {
      await removeIssue({ id });
      toast.success("Deleted");
      router.push("/process-issue");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (issue === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!issue) return <div className="p-6 text-muted-foreground">Process issue not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/process-issue">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{issue.issueNo}</h1>
            <Badge className={issue.status === "Issued" ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}>
              {issue.status}
            </Badge>
            <Badge variant="outline">{issue.processType}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{format(new Date(issue.issueDate), "dd MMM yyyy")}</p>
        </div>
        {issue.status === "Issued" && (
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

      {/* Details */}
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {[
          ["Party", issue.partyName],
          ["Marka", issue.marka],
          ["Quality", issue.qualityName],
          ["Process Type", issue.processType],
          ["Total Meter", `${issue.totalMeter}m`],
          ["Machine No", issue.machineNo ?? "—"],
          ["Operator", issue.operatorName ?? "—"],
          ["Remarks", issue.remarks ?? "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="text-muted-foreground">{label}</span>
            <p className="font-semibold text-foreground">{value}</p>
          </div>
        ))}

        <div className="col-span-2">
          <span className="text-muted-foreground">Linked Lot</span>
          <Link href={`/lots/${issue.lotId}`} className="block text-primary font-semibold hover:underline">
            {issue.lotNo} →
          </Link>
        </div>
      </div>

      {/* Complete CTA */}
      {issue.status === "Issued" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">Mark Process as Completed</p>
            <p className="text-sm text-muted-foreground">Once dyeing/printing is done, mark this issue complete.</p>
          </div>
          <Button className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete}>
            <CheckCircle size={16} />
            Mark Complete
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProcessIssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      
      
        {id
          ? <ProcessIssueDetailInner id={id as string} />
          : <div className="p-6 text-muted-foreground">Invalid ID.</div>
        }
      
    </>
  );
}
