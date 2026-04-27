"use client";

import { BatchOrderEntry } from "../_components/BatchOrderEntry";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();

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
            <h1 className="text-xl font-bold tracking-tight">New Order Entry</h1>
            <p className="text-xs text-muted-foreground">Fill in the challan details or use OCR to scan a document</p>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 p-4 md:p-6">
        <BatchOrderEntry onSuccess={() => router.push("/orders")} />
      </div>
    </div>
  );
}
