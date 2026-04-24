"use client";

import { useQuery } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Truck,
  Package,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  PendingChallan: "bg-yellow-100 text-yellow-700",
  ChallanIssued: "bg-blue-100 text-blue-700",
  LotCreated: "bg-purple-100 text-purple-700",
  InProcess: "bg-orange-100 text-orange-700",
  Completed: "bg-green-100 text-green-700",
  Dispatched: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  PendingChallan: "Pending for Challan",
  ChallanIssued: "Challan Issued",
  LotCreated: "Lot Created",
  InProcess: "In Process",
  Completed: "Completed",
  Dispatched: "Dispatched",
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-right max-w-[60%]">{String(value)}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const order = useQuery(api.orders.get, { id: id as string });

  if (order === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="ghost" onClick={() => router.push("/orders")} className="mt-3 cursor-pointer">
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
      </div>
    );
  }

  const stampedCount = order.takaDetails?.filter((t: any) => t.isStamped).length || 0;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/orders")} className="cursor-pointer">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{order.firmName}</h1>
            <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{order.marka}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(order.orderDate), "dd MMM yyyy")} · {order.qualityName}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{order.totalTaka}</p>
            <p className="text-xs text-muted-foreground">Total Takas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{order.totalMeter?.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Total Meters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{stampedCount}</p>
            <p className="text-xs text-muted-foreground">Stamped</p>
          </CardContent>
        </Card>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><FileText size={14} /> Order Details</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <InfoRow label="Date" value={format(new Date(order.orderDate), "dd MMM yyyy")} />
          <InfoRow label="Firm" value={order.firmName} />
          <InfoRow label="Master / Broker" value={order.masterName} />
          <InfoRow label="Marka" value={order.marka} />
          <InfoRow label="Quality" value={order.qualityName} />
          <InfoRow label="Job Rate" value={order.jobRate ? `₹${order.jobRate}/mtr` : undefined} />
          <InfoRow label="Grey Rate" value={order.greyRate ? `₹${order.greyRate}/mtr` : undefined} />
          <InfoRow label="Width" value={order.width ? `${order.width}"` : undefined} />
        </CardContent>
      </Card>

      {/* Weaver */}
      {order.weaverName && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Package size={14} /> Weaver Details</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <InfoRow label="Weaver" value={order.weaverName} />
            <InfoRow label="Challan No" value={order.weaverChNo} />
            <InfoRow label="Weaver Marka" value={order.weaverMarka} />
            <InfoRow label="CH Date" value={order.weaverChDate} />
          </CardContent>
        </Card>
      )}

      {/* Shipping */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Truck size={14} /> Shipping</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <InfoRow label="Mode" value={
            order.shippingMode === "DirectMills" ? "Direct Mills" :
            order.shippingMode === "MarketTempo" ? "Market Tempo" : "By LR"
          } />
          <InfoRow label="Vehicle No" value={order.vehicleNo} />
          <InfoRow label="Driver Mobile" value={order.driverMobile} />
          <InfoRow label="Transport" value={order.transportName} />
          <InfoRow label="LR No" value={order.lrNo} />
          <InfoRow label="LR Date" value={order.lrDate} />
          <InfoRow label="No. of Bales" value={order.noBales} />
        </CardContent>
      </Card>

      {/* Taka Details */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Taka Details ({order.takaDetails?.length || 0})</CardTitle>
            <span className="text-xs text-muted-foreground">
              {stampedCount}/{order.takaDetails?.length || 0} stamped
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Taka No</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Meter</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Weight</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground text-xs">Stamped</th>
                </tr>
              </thead>
              <tbody>
                {order.takaDetails?.map((t: any, i: number) => (
                  <tr key={i} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-1.5 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-1.5 font-mono text-xs">{t.takaNo}</td>
                    <td className="px-4 py-1.5 text-right text-xs">{t.meter?.toFixed(2)}</td>
                    <td className="px-4 py-1.5 text-right text-xs">{t.weight ? `${t.weight}kg` : "—"}</td>
                    <td className="px-4 py-1.5 text-center">
                      {t.isStamped ? (
                        <CheckCircle2 size={14} className="text-green-600 mx-auto" />
                      ) : (
                        <Clock size={14} className="text-muted-foreground mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {order.takaDetails?.length > 0 && (
                <tfoot className="bg-muted/30">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-xs font-semibold">TOTAL</td>
                    <td className="px-4 py-2 text-right text-sm font-bold">
                      {order.takaDetails.reduce((s: number, t: any) => s + (t.meter || 0), 0).toFixed(2)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
