"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChallanEntry } from "../../_components/ChallanEntry";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditChallanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: challanResponse, isLoading } = useQuery({
    queryKey: ["challan", id],
    queryFn: () => api.get<any>(`/challans/${id}`),
    enabled: !!id,
  });

  const challan = challanResponse?.data || challanResponse;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed header */}
      <div className="shrink-0 border-b px-6 py-4 flex items-center gap-4 bg-card">
        <Link href="/challans">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Edit Challan</h1>
          <p className="text-xs text-muted-foreground">Update existing delivery challan details</p>
        </div>
      </div>

      {/* min-h-0 is the KEY — without it flex children won't shrink/scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 md:p-6 pb-20">
          <ChallanEntry
            initialData={challan}
            onSuccess={() => router.push("/challans")}
          />
        </div>
      </div>
    </div>
  );
}
