"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchOrderEntry } from "./_components/BatchOrderEntry";
import { OrderHistory } from "./_components/OrderHistory";
import { FileText, History, Plus } from "lucide-react";

export default function OrdersUnifiedPage() {
  const [tab, setTab] = useState("entry");

  return (
    <div className="h-full flex flex-col overflow-hidden bg-muted/10">
      {/* Dynamic Header */}
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grey Inward Management</h1>
            <p className="text-sm text-muted-foreground">Manage mill challans, quality specs, and lot generation</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0 px-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-11 p-1 bg-muted/50 rounded-xl border shrink-0">
          <TabsTrigger 
            value="entry" 
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all gap-2"
          >
            <Plus size={16} /> New Entry
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all gap-2"
          >
            <History size={16} /> History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <TabsContent value="entry" className="m-0 focus-visible:outline-none focus-visible:ring-0 flex-1 flex flex-col min-h-0">
            <BatchOrderEntry />
          </TabsContent>
          <TabsContent value="history" className="m-0 focus-visible:outline-none focus-visible:ring-0 flex-1 overflow-y-auto">
            <div className="pb-10">
              <OrderHistory />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
