"use client";

import { useState, useEffect } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";


type LineItem = { description: string; marka: string; qualityName: string; meter: number; rate: number; amount: number };

export default function NewBillInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preDispatchId = searchParams.get("dispatchId");

  const [submitting, setSubmitting] = useState(false);

  // Party selection - all accounts
  const accounts = useQuery(api.accounts.list, {});
  const [partyId, setPartyId] = useState<string | "">("");
  const selectedParty = (accounts ?? []).find((a) => a._id === partyId);

  // Dispatches for party (unbilled)
  const partyDispatches = useQuery(
    api.dispatches.listByParty,
    partyId ? { partyId: partyId as string } : "skip"
  );
  const unbilledDispatches = (partyDispatches ?? []).filter((d) => d.status === "Dispatched");

  const [selectedDispatchIds, setSelectedDispatchIds] = useState<string[]>(preDispatchId ? [preDispatchId] : []);

  const [form, setForm] = useState({
    billDate: new Date().toISOString().slice(0, 10),
    gstRate: "5",
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Auto-populate line items when dispatches change
  useEffect(() => {
    if (!partyDispatches) return;
    const selected = partyDispatches.filter((d) => selectedDispatchIds.includes(d._id));
    const items: LineItem[] = selected.map((d) => ({
      description: `Job Work – ${d.dispatchNo}`,
      marka: d.marka,
      qualityName: d.qualityName,
      meter: d.finishedMeter,
      rate: 0,
      amount: 0,
    }));
    setLineItems(items);
  }, [selectedDispatchIds, partyDispatches]);

  const updateLine = (idx: number, k: keyof LineItem, v: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      const row = { ...next[idx], [k]: v };
      row.amount = row.meter * row.rate;
      next[idx] = row;
      return next;
    });
  };

  const addLine = () => setLineItems((prev) => [...prev, { description: "", marka: "", qualityName: "", meter: 0, rate: 0, amount: 0 }]);
  const removeLine = (idx: number) => setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = lineItems.reduce((sum, l) => sum + l.amount, 0);
  const gstRate = Number(form.gstRate);
  const gstAmount = subtotal * gstRate / 100;
  const totalAmount = subtotal + gstAmount;

  const createBill = useMutation(api.bills.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) { toast.error("Select a party"); return; }
    if (lineItems.length === 0) { toast.error("Add at least one line item"); return; }
    setSubmitting(true);
    try {
      await createBill({
        billDate: form.billDate,
        partyId: partyId as string,
        partyName: selectedParty?.accountName ?? "",
        gstin: selectedParty?.gstin,
        dispatchIds: selectedDispatchIds,
        lineItems,
        subtotal,
        gstRate,
        gstAmount,
        totalAmount,
        notes: form.notes || undefined,
      });
      toast.success("Bill created successfully");
      router.push("/billing");
    } catch {
      toast.error("Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDispatch = (id: string) => {
    setSelectedDispatchIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/billing"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold">New Bill</h1>
          <p className="text-sm text-muted-foreground">Generate a bill for dispatched lots</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bill basics */}
        <Card>
          <CardHeader><CardTitle className="text-base">Bill Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Bill Date *</Label>
              <Input type="date" value={form.billDate} onChange={(e) => setForm((f) => ({ ...f, billDate: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Party *</Label>
              {accounts === undefined ? <Skeleton className="h-10 w-full" /> : (
                <Select value={partyId} onValueChange={(v) => setPartyId(v as string)}>
                  <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                  <SelectContent>
                    {(accounts ?? []).map((a) => (
                      <SelectItem key={a._id} value={a._id}>{a.accountName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>GST Rate (%)</Label>
              <Select value={form.gstRate} onValueChange={(v) => setForm((f) => ({ ...f, gstRate: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["0", "5", "12", "18", "28"].map((r) => (
                    <SelectItem key={r} value={r}>{r}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch selection */}
        {partyId && (
          <Card>
            <CardHeader><CardTitle className="text-base">Link Dispatches (optional)</CardTitle></CardHeader>
            <CardContent>
              {unbilledDispatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No unbilled dispatches for this party.</p>
              ) : (
                <div className="space-y-2">
                  {unbilledDispatches.map((d) => (
                    <label key={d._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDispatchIds.includes(d._id)}
                        onChange={() => toggleDispatch(d._id)}
                        className="accent-primary"
                      />
                      <span className="font-mono text-xs text-muted-foreground">{d.dispatchNo}</span>
                      <span className="font-medium text-sm">{d.marka}</span>
                      <span className="text-sm text-muted-foreground">{d.qualityName}</span>
                      <span className="ml-auto text-sm text-green-400">{d.finishedMeter.toLocaleString()} m</span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button type="button" size="sm" variant="secondary" onClick={addLine}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No line items. Select dispatches above or add manually.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left pb-2 font-medium">Description</th>
                      <th className="text-left pb-2 font-medium">Marka</th>
                      <th className="text-left pb-2 font-medium">Quality</th>
                      <th className="text-right pb-2 font-medium">Meter</th>
                      <th className="text-right pb-2 font-medium">Rate (₹)</th>
                      <th className="text-right pb-2 font-medium">Amount (₹)</th>
                      <th className="w-8 pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {lineItems.map((l, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="py-2 pr-2"><Input value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} className="h-8 text-xs" /></td>
                        <td className="py-2 pr-2"><Input value={l.marka} onChange={(e) => updateLine(i, "marka", e.target.value)} className="h-8 text-xs w-24" /></td>
                        <td className="py-2 pr-2"><Input value={l.qualityName} onChange={(e) => updateLine(i, "qualityName", e.target.value)} className="h-8 text-xs w-28" /></td>
                        <td className="py-2 pr-2 text-right"><Input type="number" value={l.meter} onChange={(e) => updateLine(i, "meter", Number(e.target.value))} className="h-8 text-xs w-24 text-right" /></td>
                        <td className="py-2 pr-2 text-right"><Input type="number" value={l.rate} onChange={(e) => updateLine(i, "rate", Number(e.target.value))} className="h-8 text-xs w-24 text-right" /></td>
                        <td className="py-2 pr-2 text-right font-medium">₹{l.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="py-2"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLine(i)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="mt-4 flex flex-col items-end gap-1 text-sm border-t border-border pt-4">
                <div className="flex gap-8"><span className="text-muted-foreground">Subtotal</span><span className="font-medium w-32 text-right">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex gap-8"><span className="text-muted-foreground">GST ({gstRate}%)</span><span className="font-medium w-32 text-right">₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex gap-8 text-base font-bold"><span>Total</span><span className="w-32 text-right text-green-400">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Payment terms, remarks..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" asChild><Link href="/billing">Cancel</Link></Button>
          <Button type="submit" disabled={submitting || !partyId}>
            {submitting ? "Creating..." : "Create Bill"}
          </Button>
        </div>
      </form>
    </div>
  );
}


