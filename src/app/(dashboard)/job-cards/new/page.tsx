"use client";
import Link from "next/link";

import { useState } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";


type ColorRow = { colorName: string; shade: string; quantity: string; unit: string };
type ChemRow = { chemName: string; quantity: string; unit: string };

const UNITS = ["g", "kg", "ml", "L", "pcs"];

function ColorRecipeTable({
  rows,
  onChange,
}: {
  rows: ColorRow[];
  onChange: (rows: ColorRow[]) => void;
}) {
  const add = () =>
    onChange([...rows, { colorName: "", shade: "", quantity: "", unit: "g" }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof ColorRow, v: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Colour Recipe</Label>
        <Button type="button" size="sm" variant="ghost" className="gap-1 text-xs" onClick={add}>
          <Plus size={12} />Add Row
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No colours added yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_0.7fr_0.7fr_0.5fr_auto] gap-2 text-xs text-muted-foreground px-1">
            <span>Colour Name</span><span>Shade</span><span>Qty</span><span>Unit</span><span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_0.7fr_0.7fr_0.5fr_auto] gap-2 items-center">
              <Input value={r.colorName} onChange={(e) => update(i, "colorName", e.target.value)} placeholder="Red" className="h-8 text-sm" />
              <Input value={r.shade} onChange={(e) => update(i, "shade", e.target.value)} placeholder="Dark" className="h-8 text-sm" />
              <Input type="number" min={0} value={r.quantity} onChange={(e) => update(i, "quantity", e.target.value)} placeholder="100" className="h-8 text-sm" />
              <Select value={r.unit} onValueChange={(v) => update(i, "unit", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 size={13} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChemicalsTable({
  rows,
  onChange,
}: {
  rows: ChemRow[];
  onChange: (rows: ChemRow[]) => void;
}) {
  const add = () => onChange([...rows, { chemName: "", quantity: "", unit: "g" }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof ChemRow, v: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Chemicals Used</Label>
        <Button type="button" size="sm" variant="ghost" className="gap-1 text-xs" onClick={add}>
          <Plus size={12} />Add Row
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No chemicals added yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_0.7fr_0.5fr_auto] gap-2 text-xs text-muted-foreground px-1">
            <span>Chemical Name</span><span>Qty</span><span>Unit</span><span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_0.7fr_0.5fr_auto] gap-2 items-center">
              <Input value={r.chemName} onChange={(e) => update(i, "chemName", e.target.value)} placeholder="Caustic Soda" className="h-8 text-sm" />
              <Input type="number" min={0} value={r.quantity} onChange={(e) => update(i, "quantity", e.target.value)} placeholder="50" className="h-8 text-sm" />
              <Select value={r.unit} onValueChange={(v) => update(i, "unit", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 size={13} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewJobCardInner() {
  const router = useRouter();
  const createJobCard = useMutation(api.jobCards.create);

  // Lots that are InProcess (ready for job card)
  const lots = useQuery(api.lots.list, { status: "InProcess" });

  const today = new Date().toISOString().split("T")[0] ?? "";
  const [jobCardDate, setJobCardDate] = useState(today);
  const [selectedLotId, setSelectedLotId] = useState<string | "">("");
  const [machineNo, setMachineNo] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [temperature, setTemperature] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [colorRows, setColorRows] = useState<ColorRow[]>([]);
  const [chemRows, setChemRows] = useState<ChemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedLot = lots?.find((l) => l._id === selectedLotId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !selectedLot) { toast.error("Select a lot"); return; }
    if (!selectedLot.processType) { toast.error("Lot has no process type"); return; }

    setSubmitting(true);
    try {
      const id = await createJobCard({
        jobCardDate,
        lotId: selectedLotId as string,
        lotNo: selectedLot.lotNo,
        orderId: selectedLot.orderId,
        partyName: selectedLot.partyName,
        marka: selectedLot.marka,
        qualityName: selectedLot.qualityName,
        processType: selectedLot.processType,
        inputMeter: selectedLot.balanceMeter,
        machineNo: machineNo || undefined,
        operatorName: operatorName || undefined,
        colorRecipe: colorRows
          .filter((r) => r.colorName && r.quantity)
          .map((r) => ({
            colorName: r.colorName,
            shade: r.shade || undefined,
            quantity: Number(r.quantity),
            unit: r.unit,
          })),
        chemicals: chemRows
          .filter((r) => r.chemName && r.quantity)
          .map((r) => ({
            chemName: r.chemName,
            quantity: Number(r.quantity),
            unit: r.unit,
          })),
        temperature: temperature ? Number(temperature) : undefined,
        duration: duration || undefined,
        notes: notes || undefined,
      });
      toast.success("Job card created");
      router.push(`/job-cards/${id._id || id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job card");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/job-cards">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Job Card</h1>
          <p className="text-muted-foreground text-sm">Create a production job card for an in-process lot</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="font-semibold text-foreground">Job Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Job Card Date *</Label>
              <Input type="date" value={jobCardDate} onChange={(e) => setJobCardDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Select Lot (InProcess) *</Label>
              <Select value={selectedLotId} onValueChange={(v) => setSelectedLotId(v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder={lots === undefined ? "Loading…" : lots.length === 0 ? "No in-process lots" : "Select a lot"} />
                </SelectTrigger>
                <SelectContent>
                  {lots?.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.lotNo} — {l.partyName} — {l.marka} ({l.balanceMeter}m)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedLot && (
            <div className="bg-muted/40 rounded-lg p-3 grid grid-cols-3 gap-2 text-sm">
              <div><span className="text-muted-foreground block">Process</span><span className="font-medium">{selectedLot.processType}</span></div>
              <div><span className="text-muted-foreground block">Input Meter</span><span className="font-medium">{selectedLot.balanceMeter}m</span></div>
              <div><span className="text-muted-foreground block">Quality</span><span className="font-medium">{selectedLot.qualityName || "—"}</span></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Machine No</Label>
              <Input value={machineNo} onChange={(e) => setMachineNo(e.target.value)} placeholder="M-01" />
            </div>
            <div className="space-y-1.5">
              <Label>Operator Name</Label>
              <Input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} placeholder="Raju" />
            </div>
            <div className="space-y-1.5">
              <Label>Temperature (°C)</Label>
              <Input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="60" />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2 hrs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions…" />
          </div>
        </div>

        {/* Colour Recipe */}
        <div className="bg-card border border-border rounded-xl p-5">
          <ColorRecipeTable rows={colorRows} onChange={setColorRows} />
        </div>

        {/* Chemicals */}
        <div className="bg-card border border-border rounded-xl p-5">
          <ChemicalsTable rows={chemRows} onChange={setChemRows} />
        </div>

        <Button type="submit" className="w-full" disabled={submitting || !selectedLotId}>
          {submitting ? "Creating…" : "Create Job Card"}
        </Button>
      </form>
    </div>
  );
}


