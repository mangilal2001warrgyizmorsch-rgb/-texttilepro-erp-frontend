"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { BatchOrderEntry } from "../../_components/BatchOrderEntry";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Since we don't have a single order get API easily visible, we might need to filter from list
  // or check if there's a specific get API. 
  // For now, let's assume we can fetch all and find, or there's a specific order query.
  const orders = useQuery(api.orders.list, {}) || [];
  const order = orders.find((o: any) => o._id === id);

  if (!order && orders.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/orders" className="mt-4">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Edit Order Entry</h1>
            <p className="text-xs text-muted-foreground">Update existing order information and taka details</p>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 p-4 md:p-6">
        <BatchOrderEntry 
          initialOrder={order} 
          onSuccess={() => router.push("/orders")} 
        />
      </div>
    </div>
  );
}
