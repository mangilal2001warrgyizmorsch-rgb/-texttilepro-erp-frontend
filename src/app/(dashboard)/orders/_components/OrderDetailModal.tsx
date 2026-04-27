"use client";

import { useQuery } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Printer,
  FileText,
  Package,
  Truck,
  User,
  Edit2,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  PendingChallan: "bg-yellow-100 text-yellow-700",
  ChallanIssued: "bg-blue-100 text-blue-700",
  LotCreated: "bg-purple-100 text-purple-700",
  InProcess: "bg-orange-100 text-orange-700",
  Completed: "bg-green-100 text-green-700",
  Dispatched: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  PendingChallan: "Pending Challan",
  ChallanIssued: "Challan Issued",
  LotCreated: "Lot Created",
  InProcess: "In Process",
  Completed: "Completed",
  Dispatched: "Dispatched",
};

interface OrderDetailModalProps {
  order: any;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const router = useRouter();
  const lotDetails = useQuery(api.lots.list, { orderId: order._id });
  const lot = lotDetails?.[0];
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              Order Detail: {order.challanNo || "N/A"}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => router.push(`/orders/${order._id}/edit`)}
              >
                <Edit2 size={12} className="mr-1" /> Edit
              </Button>
              <Badge className={STATUS_COLORS[order.status]}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Mill: {order.firmName} · Marka: {order.marka}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <User size={10} /> Party
                </span>
                <p className="text-sm font-semibold">
                  {order.partyName || order.firmName}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  Order Date
                </span>
                <p className="text-sm font-semibold">
                  {format(new Date(order.orderDate), "dd/MM/yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Package size={10} /> Quality
                </span>
                <p className="text-sm font-semibold">{order.qualityName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Truck size={10} /> Weaver
                </span>
                <p className="text-sm font-semibold">
                  {order.weaverName || "—"}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-primary/60">
                  Total Taka
                </span>
                <p className="text-lg font-bold text-primary">
                  {order.totalTaka}
                </p>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-primary/60">
                  Total Meter
                </span>
                <p className="text-lg font-bold text-primary">
                  {order.totalMeter.toFixed(1)}m
                </p>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-primary/60">
                  Average
                </span>
                <p className="text-lg font-bold text-primary">
                  {(order.totalMeter / order.totalTaka).toFixed(1)}m
                </p>
              </div>
            </div>

            {/* Taka Table */}
            {order.takaDetails && order.takaDetails.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Roll-wise Meter List (Taka Details)
                </h3>
                <div className="border rounded-xl overflow-hidden bg-card">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-center w-16">T.N.</th>
                        <th className="px-4 py-2 text-left">Meter</th>
                        <th className="px-4 py-2 text-left">Weight</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {order.takaDetails.map((taka: any, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-4 py-2 text-center font-medium text-muted-foreground">
                            {taka.takaNo}
                          </td>
                          <td className="px-4 py-2 font-bold text-primary">
                            {taka.meter}m
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {taka.weight ? `${taka.weight}kg` : "—"}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Badge variant="outline" className="text-[9px] h-4">
                              {taka.isStamped ? "Stamped" : "Grey"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/20 font-bold border-t">
                      <tr>
                        <td className="px-4 py-2 text-center text-muted-foreground">
                          TOTAL
                        </td>
                        <td className="px-4 py-2 text-primary">
                          {order.totalMeter.toFixed(1)}m
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Associated Lot */}
            {lot && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-indigo-600">
                    Production Lot
                  </p>
                  <p className="text-sm font-bold font-mono">{lot.lotNo}</p>
                </div>
                <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
                  {lot.status}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 border-t gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => router.push(`/challans/new?orderId=${order._id}`)}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle size={16} />
            Create Challan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
