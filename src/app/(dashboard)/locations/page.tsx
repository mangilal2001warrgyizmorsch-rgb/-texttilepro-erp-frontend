"use client";

import { useState } from "react";
import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



type Section = "GreyArea" | "ProcessingArea" | "FinishedArea";

const SECTION_LABELS: Record<Section, string> = {
  GreyArea: "Grey Area",
  ProcessingArea: "Processing Area",
  FinishedArea: "Finished Area",
};

const SECTION_COLORS: Record<Section, string> = {
  GreyArea: "bg-slate-600 text-white",
  ProcessingArea: "bg-amber-600 text-white",
  FinishedArea: "bg-emerald-600 text-white",
};

const STATUS_COLORS: Record<string, string> = {
  Empty: "bg-green-600/20 text-green-700 dark:text-green-400",
  Partial: "bg-amber-600/20 text-amber-700 dark:text-amber-400",
  Full: "bg-red-600/20 text-red-700 dark:text-red-400",
};

type FormState = {
  locationId: string;
  warehouseName: string;
  section: Section;
  rack: string;
  zone: string;
  floor: string;
  capacityMeter: string;
};

const DEFAULT_FORM: FormState = {
  locationId: "",
  warehouseName: "",
  section: "GreyArea",
  rack: "",
  zone: "",
  floor: "",
  capacityMeter: "",
};

function LocationForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  editMode,
}: {
  initial: FormState;
  onSubmit: (f: FormState) => void;
  onCancel: () => void;
  submitting: boolean;
  editMode: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Location ID *</Label>
          <Input
            value={form.locationId}
            onChange={(e) => set("locationId", e.target.value)}
            placeholder="e.g. WH-A1-R1"
            disabled={editMode}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Warehouse Name *</Label>
          <Input
            value={form.warehouseName}
            onChange={(e) => set("warehouseName", e.target.value)}
            placeholder="e.g. Main Warehouse"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Section *</Label>
        <Select value={form.section} onValueChange={(v) => set("section", v as Section)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="GreyArea">Grey Area</SelectItem>
            <SelectItem value="ProcessingArea">Processing Area</SelectItem>
            <SelectItem value="FinishedArea">Finished Area</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Rack</Label>
          <Input value={form.rack} onChange={(e) => set("rack", e.target.value)} placeholder="A1" />
        </div>
        <div className="space-y-1.5">
          <Label>Zone</Label>
          <Input value={form.zone} onChange={(e) => set("zone", e.target.value)} placeholder="North" />
        </div>
        <div className="space-y-1.5">
          <Label>Floor</Label>
          <Input value={form.floor} onChange={(e) => set("floor", e.target.value)} placeholder="G" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Capacity (meters) *</Label>
        <Input
          type="number"
          min={1}
          value={form.capacityMeter}
          onChange={(e) => set("capacityMeter", e.target.value)}
          placeholder="500"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1"
          onClick={() => onSubmit(form)}
          disabled={submitting || !form.locationId || !form.warehouseName || !form.capacityMeter}
        >
          {submitting ? "Saving..." : editMode ? "Update Location" : "Add Location"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function LocationsInner() {
  const [sectionFilter, setSectionFilter] = useState<Section | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const locations = useQuery(api.locations.list, { section: sectionFilter });
  const createLocation = useMutation(api.locations.create);
  const updateLocation = useMutation(api.locations.update);
  const removeLocation = useMutation(api.locations.delete);

  const openCreate = () => { setEditTarget(null); setShowDialog(true); };
  const openEdit = (loc: any) => { setEditTarget(loc); setShowDialog(true); };

  const handleSubmit = async (form: FormState) => {
    setSubmitting(true);
    try {
      if (editTarget) {
        await updateLocation({
          id: editTarget._id,
          warehouseName: form.warehouseName,
          section: form.section,
          rack: form.rack || undefined,
          zone: form.zone || undefined,
          floor: form.floor || undefined,
          capacityMeter: Number(form.capacityMeter),
        });
        toast.success("Location updated");
      } else {
        await createLocation({
          locationId: form.locationId,
          warehouseName: form.warehouseName,
          section: form.section,
          rack: form.rack || undefined,
          zone: form.zone || undefined,
          floor: form.floor || undefined,
          capacityMeter: Number(form.capacityMeter),
        });
        toast.success("Location added");
      }
      setShowDialog(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save location";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete location "${name}"?`)) return;
    try {
      await removeLocation({ id });
      toast.success("Location deleted");
    } catch {
      toast.error("Failed to delete location");
    }
  };

  const editInitial: FormState = editTarget
    ? {
        locationId: editTarget.locationId,
        warehouseName: editTarget.warehouseName,
        section: editTarget.section,
        rack: editTarget.rack ?? "",
        zone: editTarget.zone ?? "",
        floor: editTarget.floor ?? "",
        capacityMeter: String(editTarget.capacityMeter),
      }
    : DEFAULT_FORM;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Location Master</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage warehouse locations and storage capacity</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={16} />Add Location
        </Button>
      </div>

      {/* Section Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["All", "GreyArea", "ProcessingArea", "FinishedArea"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={sectionFilter === (s === "All" ? undefined : s) ? "default" : "ghost"}
            onClick={() => setSectionFilter(s === "All" ? undefined : s)}
          >
            {s === "All" ? "All Sections" : SECTION_LABELS[s]}
          </Button>
        ))}
      </div>

      {locations === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><MapPin /></EmptyMedia>
            <EmptyTitle>No locations yet</EmptyTitle>
            <EmptyDescription>Add warehouse locations to track fabric storage.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((loc) => {
            const pct = loc.capacityMeter > 0
              ? Math.min(100, Math.round((loc.occupiedMeter / loc.capacityMeter) * 100))
              : 0;
            return (
              <div key={loc._id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{loc.locationId}</span>
                      <Badge className={SECTION_COLORS[loc.section]}>{SECTION_LABELS[loc.section]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{loc.warehouseName}</p>
                    {(loc.rack || loc.zone || loc.floor) && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {[loc.rack && `Rack ${loc.rack}`, loc.zone && `Zone ${loc.zone}`, loc.floor && `Floor ${loc.floor}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(loc)}>
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(loc._id, loc.locationId)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{loc.occupiedMeter}m used</span>
                    <span>{loc.capacityMeter}m total</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[loc.status]}`}>{loc.status}</Badge>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Location" : "Add New Location"}</DialogTitle>
          </DialogHeader>
          <LocationForm
            key={editTarget?._id ?? "new"}
            initial={editInitial}
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
            submitting={submitting}
            editMode={!!editTarget}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}


