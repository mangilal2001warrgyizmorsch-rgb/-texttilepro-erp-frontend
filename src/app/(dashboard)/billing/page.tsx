"use client";

import { useState } from "react";
import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Plus, Search, FileText } from "lucide-react";
import { format } from "date-fns";

type StatusFilter = "all" | "Draft" | "Issued" | "Paid";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Issued: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Paid: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function BillingListInner() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const bills = useQuery(
    api.bills.list,
    filter === "all" ? {} : { status: filter }
  );

  const filtered = (bills ?? []).filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.billNo.toLowerCase().includes(q) ||
      b.partyName.toLowerCase().includes(q)
    );
  });

  const statusTabs: StatusFilter[] = ["all", "Draft", "Issued", "Paid"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and track bills for dispatched goods</p>
        </div>
        <Button asChild>
          <Link href="/billing/new">
            <Plus className="w-4 h-4 mr-2" />
            New Bill
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search bill no, party..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((s) => (
            <Button key={s} variant={filter === s ? "default" : "secondary"} size="sm" onClick={() => setFilter(s)} className="capitalize cursor-pointer">
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </div>

      {bills === undefined ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText /></EmptyMedia>
            <EmptyTitle>No bills found</EmptyTitle>
            <EmptyDescription>Create a bill from dispatched lots.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Bill No</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Party</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Subtotal</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">GST</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Total</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b._id} className={`border-t border-border hover:bg-muted/20 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3">
                    <Link href={`/billing/${b._id}`} className="font-mono text-primary hover:underline">{b.billNo}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(b.billDate), "dd/MM/yyyy")}</td>
                  <td className="px-4 py-3 font-medium">{b.partyName}</td>
                  <td className="px-4 py-3 text-right">₹{b.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right">₹{b.gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-400">₹{b.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={STATUS_COLORS[b.status]}>{b.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


