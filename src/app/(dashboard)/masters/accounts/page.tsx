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
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

type RoleType = "Mill" | "Weaver" | "Transporter" | "Master" | "Customer" | "Supplier";
type GstType = "Regular" | "Composition";

const ROLE_COLORS: Record<RoleType, string> = {
  Mill: "bg-blue-100 text-blue-700",
  Weaver: "bg-purple-100 text-purple-700",
  Transporter: "bg-orange-100 text-orange-700",
  Master: "bg-green-100 text-green-700",
  Customer: "bg-pink-100 text-pink-700",
  Supplier: "bg-cyan-100 text-cyan-700",
};

type FormData = {
  gstin: string;
  accountName: string;
  clientCode: string;
  roleType: RoleType;
  panNo: string;
  gstType: GstType;
  mobileNo: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  defaultAgent: string;
  creditDays: string;
  openingBalance: string;
  isActive: boolean;
};

const defaultForm: FormData = {
  gstin: "",
  accountName: "",
  clientCode: "",
  roleType: "Mill",
  panNo: "",
  gstType: "Regular",
  mobileNo: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  defaultAgent: "",
  creditDays: "",
  openingBalance: "",
  isActive: true,
};

export default function AccountsPage() {
  const queryClient = useQueryClient();
  
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.get<any[]>("/accounts"),
  });

  const createAccount = useMutation({
    mutationFn: (data: any) => api.post("/accounts", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] })
  });
  
  const updateAccount = useMutation({
    mutationFn: (data: any) => api.patch(`/accounts/${data.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] })
  });

  const removeAccount = useMutation({
    mutationFn: (data: { id: string }) => api.delete(`/accounts/${data.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] })
  });

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);

  const filtered = (accounts ?? []).filter((a) => {
    const matchSearch =
      a.accountName.toLowerCase().includes(search.toLowerCase()) ||
      (a.clientCode ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || a.roleType === filterRole;
    return matchSearch && matchRole;
  });

  const set = (key: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openNew = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  type Account = NonNullable<typeof accounts>[0];
  const openEdit = (a: Account) => {
    if (!a) return;
    setEditId(a._id);
    setForm({
      gstin: a.gstin ?? "",
      accountName: a.accountName,
      clientCode: a.clientCode ?? "",
      roleType: a.roleType,
      panNo: a.panNo ?? "",
      gstType: a.gstType,
      mobileNo: a.mobileNo ?? "",
      email: a.email ?? "",
      address: a.address ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      pincode: a.pincode ?? "",
      defaultAgent: a.defaultAgent ?? "",
      creditDays: a.creditDays?.toString() ?? "",
      openingBalance: a.openingBalance?.toString() ?? "",
      isActive: a.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.accountName.trim()) {
      toast.error("Account Name is required");
      return;
    }
    try {
      const payload = {
        gstin: form.gstin || undefined,
        accountName: form.accountName,
        clientCode: form.clientCode || undefined,
        roleType: form.roleType,
        panNo: form.panNo || undefined,
        gstType: form.gstType,
        mobileNo: form.mobileNo || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        defaultAgent: form.defaultAgent || undefined,
        creditDays: form.creditDays ? Number(form.creditDays) : undefined,
        openingBalance: form.openingBalance ? Number(form.openingBalance) : undefined,
        isActive: form.isActive,
      };
      if (editId) {
        await updateAccount.mutateAsync({ id: editId, ...payload });
        toast.success("Account updated");
      } else {
        await createAccount.mutateAsync(payload);
        toast.success("Account created");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save account");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeAccount.mutateAsync({ id });
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Account Master</h1>
          <p className="text-sm text-muted-foreground">Manage Mills, Weavers, Transporters & Masters</p>
        </div>
        <Button onClick={openNew} className="cursor-pointer">
          <Plus size={16} className="mr-1" /> New Account
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Mill">Mill</SelectItem>
            <SelectItem value="Weaver">Weaver</SelectItem>
            <SelectItem value="Transporter">Transporter</SelectItem>
            <SelectItem value="Master">Master</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
            <SelectItem value="Supplier">Supplier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {accounts === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No accounts found</EmptyTitle>
            <EmptyDescription>Add your first account to get started</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openNew} className="cursor-pointer">
              <Plus size={14} className="mr-1" /> Create Account
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card key={a._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{a.accountName}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[a.roleType]}`}
                      >
                        {a.roleType}
                      </span>
                      {!a.isActive && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {a.clientCode && <span>Code: {a.clientCode}</span>}
                      {a.mobileNo && <span>{a.mobileNo}</span>}
                      {a.city && <span>{a.city}</span>}
                      {a.gstin && <span>GSTIN: {a.gstin}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => openEdit(a)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                    onClick={() => handleDelete(a._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Account" : "New Account"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label>Account Name *</Label>
              <Input
                placeholder="e.g. Rajesh Mills"
                value={form.accountName}
                onChange={(e) => set("accountName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role Type *</Label>
              <Select value={form.roleType} onValueChange={(v) => set("roleType", v as RoleType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mill">Mill</SelectItem>
                  <SelectItem value="Weaver">Weaver</SelectItem>
                  <SelectItem value="Transporter">Transporter</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>GSTIN</Label>
              <Input
                placeholder="22AAAAA0000A1Z5"
                value={form.gstin}
                onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label>GST Type</Label>
              <Select value={form.gstType} onValueChange={(v) => set("gstType", v as GstType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Composition">Composition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client Code</Label>
              <Input placeholder="e.g. RM001" value={form.clientCode} onChange={(e) => set("clientCode", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>PAN No</Label>
              <Input placeholder="AAAAA0000A" value={form.panNo} onChange={(e) => set("panNo", e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile No</Label>
              <Input placeholder="9876543210" value={form.mobileNo} onChange={(e) => set("mobileNo", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input placeholder="example@gmail.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Street address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input placeholder="Surat" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input placeholder="Gujarat" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Pincode</Label>
              <Input placeholder="395001" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Default Agent</Label>
              <Input placeholder="Agent name" value={form.defaultAgent} onChange={(e) => set("defaultAgent", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Credit Days</Label>
              <Input type="number" placeholder="30" value={form.creditDays} onChange={(e) => set("creditDays", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Opening Balance</Label>
              <Input type="number" placeholder="0" value={form.openingBalance} onChange={(e) => set("openingBalance", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active Account
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleSave} className="cursor-pointer">
              {editId ? "Update" : "Create"} Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
