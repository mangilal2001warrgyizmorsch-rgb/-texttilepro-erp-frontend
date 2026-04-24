"use client";

import {  useQuery, useMutation  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { toast } from "sonner";

import type { UserRole } from "@/hooks/use-user-role";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  manager: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  operator: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const ROLE_DESC: Record<string, string> = {
  owner: "Full access — financials, user management, all operations",
  manager: "Can create & manage orders, lots, dispatch, billing",
  operator: "Can view and update production, stamping, job cards",
};

export default function UserManagementInner() {
  const { isOwner, isLoading, user: currentUser } = useUserRole();
  const users = useQuery(api.users.list, isOwner ? {} : "skip");
  const updateRole = useMutation(api.users.updateRole);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateRole({ userId, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  if (isLoading || users === undefined) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isOwner) return (
    <div className="p-6 text-center text-muted-foreground">Access denied. Owner role required.</div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/owner/dashboard"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-5 h-5" /> User Management</h1>
          <p className="text-sm text-muted-foreground">Assign roles to control access across the ERP</p>
        </div>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["owner", "manager", "operator"] as UserRole[]).map((r) => (
          <Card key={r}>
            <CardContent className="py-3 px-4">
              <Badge variant="outline" className={`${ROLE_COLORS[r]} mb-2`}>{r}</Badge>
              <p className="text-xs text-muted-foreground">{ROLE_DESC[r]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> System Users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Current Role</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isMe = u._id === currentUser?._id;
                return (
                  <tr key={u._id} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3 font-medium">
                      {u.name ?? "—"}
                      {isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={ROLE_COLORS[u.role ?? "operator"]}>{u.role ?? "—"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <span className="text-xs text-muted-foreground italic">Cannot change own role</span>
                      ) : (
                        <Select
                          value={u.role ?? "operator"}
                          onValueChange={(v) => handleRoleChange(u._id, v as UserRole)}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">owner</SelectItem>
                            <SelectItem value="manager">manager</SelectItem>
                            <SelectItem value="operator">operator</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


