"use client";
import Link from "next/link";

import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Truck, Package, User } from "lucide-react";
import { format } from "date-fns";


const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Dispatched: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Billed: "bg-green-500/20 text-green-400 border-green-500/30",
};

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

export default function DispatchDetailInner() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useQuery(api.dispatches.get, { id: id as string });

  if (dispatch === undefined) {
    return <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }
  if (dispatch === null) {
    return <div className="p-6 text-center text-muted-foreground">Dispatch not found.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/dispatch"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{dispatch.dispatchNo}</h1>
            <Badge variant="outline" className={STATUS_COLORS[dispatch.status]}>{dispatch.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{format(new Date(dispatch.dispatchDate), "dd MMM yyyy")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4" /> Lot & Party</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detail label="Party" value={dispatch.partyName} />
            <Detail label="Lot No" value={dispatch.lotNo} />
            <Detail label="Marka" value={dispatch.marka} />
            <Detail label="Quality" value={dispatch.qualityName} />
            <Detail label="Finished Meter" value={`${dispatch.finishedMeter.toLocaleString()} m`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" /> Transport</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detail label="Mode" value={dispatch.shippingMode} />
            <Detail label="Transport" value={dispatch.transportName} />
            <Detail label="Vehicle No" value={dispatch.vehicleNo} />
            <Detail label="Driver Mobile" value={dispatch.driverMobile} />
            <Detail label="LR No" value={dispatch.lrNo} />
            <Detail label="LR Date" value={dispatch.lrDate ? format(new Date(dispatch.lrDate), "dd/MM/yyyy") : undefined} />
            <Detail label="No. of Bales" value={dispatch.noBales} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Receiver</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detail label="Receiver Name" value={dispatch.receiverName} />
            <Detail label="Receiver Mobile" value={dispatch.receiverMobile} />
          </CardContent>
        </Card>

        {dispatch.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{dispatch.notes}</p></CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-3">
        <Button asChild variant="secondary"><Link href="/dispatch">Back to List</Link></Button>
        {dispatch.status === "Dispatched" && (
          <Button asChild><Link href={`/billing/new?dispatchId=${dispatch._id}`}>Create Bill</Link></Button>
        )}
      </div>
    </div>
  );
}


