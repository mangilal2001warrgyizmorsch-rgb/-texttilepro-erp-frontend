"use client";

import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  Users,
  ShoppingCart,
  Layers,
  MapPin,
  Factory,
  Truck,
  TrendingUp,
  AlertCircle,
  FileText,
  ClipboardList,
  PackageCheck,
} from "lucide-react";

export default function Dashboard() {
  const accounts = useQuery(api.accounts.list, {});
  const qualities = useQuery(api.qualities.list, {});
  const weavers = useQuery(api.weavers.list, {});

  // Order pipeline stats
  const ordersActive = useQuery(api.orders.list, { status: "ChallanIssued" });
  const ordersInProcess = useQuery(api.orders.list, { status: "InProcess" });
  const ordersCompleted = useQuery(api.orders.list, { status: "Completed" });

  // Lots
  const lotsInStorage = useQuery(api.lots.list, { status: "InStorage" });
  const lotsFinished = useQuery(api.lots.list, { status: "Finished" });

  // Dispatch / Billing
  const dispatched = useQuery(api.dispatches.list, { status: "Dispatched" });
  const draftBills = useQuery(api.bills.list, { status: "Draft" });
  const issuedBills = useQuery(api.bills.list, { status: "Issued" });

  const router = useRouter();

  const loading = accounts === undefined || qualities === undefined || weavers === undefined;

  const masterStats = [
    {
      label: "Total Accounts",
      value: accounts?.length ?? 0,
      icon: <Users size={20} />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/masters/accounts",
    },
    {
      label: "Qualities",
      value: qualities?.length ?? 0,
      icon: <TrendingUp size={20} />,
      color: "text-green-400",
      bg: "bg-green-500/10",
      href: "/masters/qualities",
    },
    {
      label: "Weavers",
      value: weavers?.length ?? 0,
      icon: <Factory size={20} />,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      href: "/masters/weavers",
    },
  ];

  const pipelineStats = [
    { label: "In Process", value: ordersInProcess?.length ?? 0, icon: <ClipboardList size={18} />, href: "/orders", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Lots in Storage", value: lotsInStorage?.length ?? 0, icon: <Layers size={18} />, href: "/lots", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Finished Lots", value: lotsFinished?.length ?? 0, icon: <PackageCheck size={18} />, href: "/lots", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Dispatched", value: dispatched?.length ?? 0, icon: <Truck size={18} />, href: "/dispatch", color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Draft Bills", value: draftBills?.length ?? 0, icon: <FileText size={18} />, href: "/billing", color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Issued Bills", value: issuedBills?.length ?? 0, icon: <FileText size={18} />, href: "/billing", color: "text-green-400", bg: "bg-green-500/10" },
  ];

  const quickLinks = [
    { label: "New Order", icon: <ShoppingCart size={18} />, href: "/orders/new", color: "bg-primary text-primary-foreground" },
    { label: "New Dispatch", icon: <Truck size={18} />, href: "/dispatch/new", color: "bg-blue-600 text-white" },
    { label: "New Bill", icon: <FileText size={18} />, href: "/billing/new", color: "bg-emerald-600 text-white" },
    { label: "Location Map", icon: <MapPin size={18} />, href: "/location-dashboard", color: "bg-slate-600 text-white" },
  ];

  const pendingDispatch = lotsFinished?.length ?? 0;
  const unpaidBills = issuedBills?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Textile Dyeing & Printing ERP — Factory Overview</p>
      </div>

      {/* Alerts */}
      {(pendingDispatch > 0 || unpaidBills > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {pendingDispatch > 0 && (
            <button
              onClick={() => router.push("/dispatch/new")}
              className="flex-1 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-left cursor-pointer hover:bg-emerald-500/20 transition-colors"
            >
              <PackageCheck size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">{pendingDispatch} Finished Lot{pendingDispatch > 1 ? "s" : ""} Ready to Dispatch</p>
                <p className="text-xs text-emerald-400/70">Click to create dispatch</p>
              </div>
            </button>
          )}
          {unpaidBills > 0 && (
            <button
              onClick={() => router.push("/billing")}
              className="flex-1 flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-left cursor-pointer hover:bg-orange-500/20 transition-colors"
            >
              <FileText size={18} className="text-orange-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-300">{unpaidBills} Bill{unpaidBills > 1 ? "s" : ""} Awaiting Payment</p>
                <p className="text-xs text-orange-400/70">Click to view bills</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Master stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          : masterStats.map((s) => (
              <Card key={s.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(s.href)}>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Pipeline stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineStats.map((s) => (
            <Card key={s.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(s.href)}>
              <CardContent className="flex flex-col items-center gap-2 py-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground text-center leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((q) => (
            <button
              key={q.label}
              onClick={() => router.push(q.href)}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl font-medium text-sm cursor-pointer transition-opacity hover:opacity-90 ${q.color}`}
            >
              {q.icon}
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Production Flow */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Production Flow</h2>
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                "Account Master",
                "Order Entry",
                "Party Challan",
                "Lot Creation",
                "Location Assignment",
                "Stamping",
                "Send to Process",
                "Job Card",
                "Production",
                "Dispatch",
                "Billing",
              ].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{step}</Badge>
                  {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Getting Started</p>
            <p className="text-sm text-amber-400/80 mt-1">
              Start by creating your <strong>Account Master</strong> (Mills, Weavers, Transporters), then add{" "}
              <strong>Quality Master</strong> records. Once masters are set up, begin with <strong>Order Entry</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
