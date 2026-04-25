"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Star } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

type ProcessType = "Dyeing" | "Printing" | "Both";

type FormData = {
  qualityName: string;
  gsm: string;
  width: string;
  unit: string;
  hsnCode: string;
  processType: ProcessType;
  expectedLossPercent: string;
  shortPercent: string;
  defaultJobRate: string;
  greyRate: string;
  dispatchRate: string;
};

const defaultForm: FormData = {
  qualityName: "",
  gsm: "",
  width: "",
  unit: "Meter",
  hsnCode: "",
  processType: "Dyeing",
  expectedLossPercent: "",
  shortPercent: "",
  defaultJobRate: "",
  greyRate: "",
  dispatchRate: "",
};

const PROCESS_COLORS: Record<ProcessType, string> = {
  Dyeing: "bg-blue-100 text-blue-700",
  Printing: "bg-purple-100 text-purple-700",
  Both: "bg-green-100 text-green-700",
};

export default function QualitiesPage() {
  const queryClient = useQueryClient();
  
  const { data: qualities } = useQuery({
    queryKey: ["qualities"],
    queryFn: () => api.get<any[]>("/qualities"),
  });

  const createQuality = useMutation({
    mutationFn: (data: any) => api.post("/qualities", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qualities"] })
  });
  
  const updateQuality = useMutation({
    mutationFn: (data: any) => api.patch(`/qualities/${data.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qualities"] })
  });

  const removeQuality = useMutation({
    mutationFn: (data: { id: string }) => api.delete(`/qualities/${data.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qualities"] })
  });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);

  const filtered = (qualities ?? []).filter((q) =>
    q.qualityName.toLowerCase().includes(search.toLowerCase())
  );

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (q: NonNullable<typeof qualities>[0]) => {
    setEditId(q._id);
    setForm({
      qualityName: q.qualityName,
      gsm: q.gsm?.toString() ?? "",
      width: q.width?.toString() ?? "",
      unit: q.unit ?? "Meter",
      hsnCode: q.hsnCode ?? "",
      processType: q.processType,
      expectedLossPercent: q.expectedLossPercent?.toString() ?? "",
      shortPercent: q.shortPercent?.toString() ?? "",
      defaultJobRate: q.defaultJobRate?.toString() ?? "",
      greyRate: q.greyRate?.toString() ?? "",
      dispatchRate: q.dispatchRate?.toString() ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.qualityName.trim()) {
      toast.error("Quality Name is required");
      return;
    }
    try {
      const num = (v: string) => (v ? Number(v) : undefined);
      const payload = {
        qualityName: form.qualityName,
        gsm: num(form.gsm),
        width: num(form.width),
        unit: form.unit || undefined,
        hsnCode: form.hsnCode || undefined,
        processType: form.processType,
        expectedLossPercent: num(form.expectedLossPercent),
        shortPercent: num(form.shortPercent),
        defaultJobRate: num(form.defaultJobRate),
        greyRate: num(form.greyRate),
        dispatchRate: num(form.dispatchRate),
      };
      if (editId) {
        await updateQuality.mutateAsync({ id: editId, ...payload });
        toast.success("Quality updated");
      } else {
        await createQuality.mutateAsync(payload);
        toast.success("Quality created");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeQuality.mutateAsync({ id });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Quality Master</h1>
          <p className="text-sm text-muted-foreground">Define fabric qualities with rates and process types</p>
        </div>
        <Button onClick={openNew} className="cursor-pointer">
          <Plus size={16} className="mr-1" /> New Quality
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search quality..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {qualities === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Star /></EmptyMedia>
            <EmptyTitle>No qualities found</EmptyTitle>
            <EmptyDescription>Add fabric quality types with rates and process info</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openNew} className="cursor-pointer">
              <Plus size={14} className="mr-1" /> Add Quality
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <Card key={q._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{q.qualityName}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PROCESS_COLORS[q.processType]}`}>
                      {q.processType}
                    </span>
                    {q.hsnCode && <Badge variant="secondary" className="text-[10px]">HSN: {q.hsnCode}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-1 text-xs text-muted-foreground">
                    {q.gsm && <span>GSM: {q.gsm}</span>}
                    {q.width && <span>Width: {q.width}&quot;</span>}
                    {q.defaultJobRate && <span>Job Rate: ₹{q.defaultJobRate}</span>}
                    {q.greyRate && <span>Grey Rate: ₹{q.greyRate}</span>}
                    {q.expectedLossPercent && <span>Loss: {q.expectedLossPercent}%</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(q)}>
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                    onClick={() => handleDelete(q._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Quality" : "New Quality"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Quality Name *</Label>
              <Input placeholder="e.g. Cotton 60x60 / Polyester 100D" value={form.qualityName} onChange={(e) => set("qualityName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Process Type *</Label>
              <Select value={form.processType} onValueChange={(v) => set("processType", v as ProcessType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dyeing">Dyeing</SelectItem>
                  <SelectItem value="Printing">Printing</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>HSN Code</Label>
              <Input placeholder="5208" value={form.hsnCode} onChange={(e) => set("hsnCode", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>GSM / Weight</Label>
              <Input type="number" placeholder="120" value={form.gsm} onChange={(e) => set("gsm", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Width (inches)</Label>
              <Input type="number" placeholder="44" value={form.width} onChange={(e) => set("width", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input placeholder="Meter" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Default Job Rate (₹/meter)</Label>
              <Input type="number" placeholder="5.00" value={form.defaultJobRate} onChange={(e) => set("defaultJobRate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Grey Rate (₹/meter)</Label>
              <Input type="number" placeholder="45.00" value={form.greyRate} onChange={(e) => set("greyRate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dispatch Rate (₹/meter)</Label>
              <Input type="number" placeholder="50.00" value={form.dispatchRate} onChange={(e) => set("dispatchRate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expected Loss %</Label>
              <Input type="number" placeholder="2.5" value={form.expectedLossPercent} onChange={(e) => set("expectedLossPercent", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Short %</Label>
              <Input type="number" placeholder="1.0" value={form.shortPercent} onChange={(e) => set("shortPercent", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} className="cursor-pointer">{editId ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
