"use client";
import Link from "next/link";

import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";


const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Issued: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Paid: "bg-green-500/20 text-green-400 border-green-500/30",
};

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

export default function BillDetailInner() {
  const { id } = useParams<{ id: string }>();
  const bill = useQuery(api.bills.get, { id: id as string });
  const updateStatus = useMutation(api.bills.updateStatus);

  const handleStatusChange = async (status: "Issued" | "Paid") => {
    try {
      await updateStatus({ id: id as string, status });
      toast.success(`Bill marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (bill === undefined) {
    return <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }
  if (bill === null) {
    return <div className="p-6 text-center text-muted-foreground">Bill not found.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/billing"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{bill.billNo}</h1>
            <Badge variant="outline" className={STATUS_COLORS[bill.status]}>{bill.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{format(new Date(bill.billDate), "dd MMM yyyy")}</p>
        </div>
        <div className="flex gap-2">
          {bill.status === "Draft" && (
            <Button size="sm" onClick={() => handleStatusChange("Issued")}>
              <FileText className="w-3.5 h-3.5 mr-1" /> Issue Bill
            </Button>
          )}
          {bill.status === "Issued" && (
            <Button size="sm" onClick={() => handleStatusChange("Paid")}>
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Party Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detail label="Party Name" value={bill.partyName} />
            <Detail label="GSTIN" value={bill.gstin} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Bill Summary</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detail label="Subtotal" value={`₹${bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
            <Detail label={`GST (${bill.gstRate}%)`} value={`₹${bill.gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
            <Detail label="Total Amount" value={`₹${bill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">#</th>
                  <th className="text-left pb-2 font-medium">Description</th>
                  <th className="text-left pb-2 font-medium">Marka</th>
                  <th className="text-left pb-2 font-medium">Quality</th>
                  <th className="text-right pb-2 font-medium">Meter</th>
                  <th className="text-right pb-2 font-medium">Rate (₹)</th>
                  <th className="text-right pb-2 font-medium">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {bill.lineItems.map((l, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-3">{l.description}</td>
                    <td className="py-2 pr-3">{l.marka}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{l.qualityName}</td>
                    <td className="py-2 text-right">{l.meter.toLocaleString()}</td>
                    <td className="py-2 text-right">₹{l.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right font-medium">₹{l.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={5} />
                  <td className="py-2 text-right text-muted-foreground text-xs">Subtotal</td>
                  <td className="py-2 text-right font-medium">₹{bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={5} />
                  <td className="py-1 text-right text-muted-foreground text-xs">GST ({bill.gstRate}%)</td>
                  <td className="py-1 text-right font-medium">₹{bill.gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="text-base font-bold">
                  <td colSpan={5} />
                  <td className="py-2 text-right">Total</td>
                  <td className="py-2 text-right text-green-400">₹{bill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {bill.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm mt-1">{bill.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


