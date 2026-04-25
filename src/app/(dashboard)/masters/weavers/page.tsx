"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Scissors } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

type FormData = {
  weaverName: string;
  weaverCode: string;
  gstin: string;
  mobileNo: string;
  address: string;
};

const defaultForm: FormData = {
  weaverName: "",
  weaverCode: "",
  gstin: "",
  mobileNo: "",
  address: "",
};

export default function WeaversPage() {
  const queryClient = useQueryClient();
  
  const { data: weavers } = useQuery({
    queryKey: ["weavers"],
    queryFn: () => api.get<any[]>("/weavers"),
  });

  const createWeaver = useMutation({
    mutationFn: (data: any) => api.post("/weavers", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weavers"] })
  });
  
  const updateWeaver = useMutation({
    mutationFn: (data: any) => api.patch(`/weavers/${data.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weavers"] })
  });

  const removeWeaver = useMutation({
    mutationFn: (data: { id: string }) => api.delete(`/weavers/${data.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weavers"] })
  });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);

  const filtered = (weavers ?? []).filter(
    (w) =>
      w.weaverName.toLowerCase().includes(search.toLowerCase()) ||
      w.weaverCode.toLowerCase().includes(search.toLowerCase())
  );

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (w: NonNullable<typeof weavers>[0]) => {
    setEditId(w._id);
    setForm({
      weaverName: w.weaverName,
      weaverCode: w.weaverCode,
      gstin: w.gstin ?? "",
      mobileNo: w.mobileNo ?? "",
      address: w.address ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.weaverName.trim() || !form.weaverCode.trim()) {
      toast.error("Weaver Name and Code are required");
      return;
    }
    try {
      if (editId) {
        await updateWeaver.mutateAsync({
          id: editId,
          weaverName: form.weaverName,
          weaverCode: form.weaverCode,
          gstin: form.gstin || undefined,
          mobileNo: form.mobileNo || undefined,
          address: form.address || undefined,
        });
        toast.success("Weaver updated");
      } else {
        await createWeaver.mutateAsync({
          weaverName: form.weaverName,
          weaverCode: form.weaverCode,
          gstin: form.gstin || undefined,
          mobileNo: form.mobileNo || undefined,
          address: form.address || undefined,
        });
        toast.success("Weaver created");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeWeaver.mutateAsync({ id });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Weaver Master</h1>
          <p className="text-sm text-muted-foreground">Manage weaver accounts and their codes</p>
        </div>
        <Button onClick={openNew} className="cursor-pointer">
          <Plus size={16} className="mr-1" /> New Weaver
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {weavers === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Scissors /></EmptyMedia>
            <EmptyTitle>No weavers found</EmptyTitle>
            <EmptyDescription>Add weavers who supply grey fabric</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openNew} className="cursor-pointer">
              <Plus size={14} className="mr-1" /> Add Weaver
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((w) => (
            <Card key={w._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{w.weaverName}</p>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono mt-1 inline-block">
                      {w.weaverCode}
                    </span>
                    {w.gstin && <p className="text-[10px] font-bold text-primary mt-1">GST: {w.gstin}</p>}
                    {w.mobileNo && <p className="text-xs text-muted-foreground mt-0.5">{w.mobileNo}</p>}
                    {w.address && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{w.address}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 cursor-pointer" onClick={() => openEdit(w)}>
                      <Edit size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
                      onClick={() => handleDelete(w._id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Weaver" : "New Weaver"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Weaver Name *</Label>
              <Input placeholder="e.g. Ramesh Weaving" value={form.weaverName} onChange={(e) => set("weaverName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Weaver Code *</Label>
              <Input placeholder="e.g. RW001" value={form.weaverCode} onChange={(e) => set("weaverCode", e.target.value.toUpperCase())} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>GST Number</Label>
              <Input placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile No</Label>
              <Input placeholder="9876543210" value={form.mobileNo} onChange={(e) => set("mobileNo", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Full address" value={form.address} onChange={(e) => set("address", e.target.value)} />
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
