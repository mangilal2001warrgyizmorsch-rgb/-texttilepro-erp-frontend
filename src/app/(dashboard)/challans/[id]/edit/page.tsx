"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChallanEntry } from "../../_components/ChallanEntry";
import { Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <ChallanEntry 
        initialData={challan} 
        onSuccess={() => router.push("/challans")} 
      />
    </div>
  );
}
