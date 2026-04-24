"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth";
import { useUserRole, type UserRole } from "@/hooks/use-user-role";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Lock,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Crown,
} from "lucide-react";
import { format } from "date-fns";

const ROLE_BADGES: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  manager: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  operator: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  operator: "Operator",
};

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { isOwner } = useUserRole();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: (user as any)?.phone || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Owner: user management
  const [allUsers, setAllUsers] = useState<any[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  // Fetch all users if owner
  const loadUsers = async () => {
    if (!isOwner) return;
    setUsersLoading(true);
    try {
      const data = await api.get<any[]>("/users");
      setAllUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  // Load users on mount if owner
  useState(() => {
    if (isOwner) loadUsers();
  });

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await api.patch<any>("/auth/profile", {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      updateUser(updated);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleUpdating(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setAllUsers(
        (prev) =>
          prev?.map((u) =>
            u._id === userId ? { ...u, role: newRole } : u
          ) ?? null
      );
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setRoleUpdating(null);
    }
  };

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const initials = (user.name || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={ROLE_BADGES[user.role] || ROLE_BADGES.operator}
            >
              <Shield size={10} className="mr-1" />
              {ROLE_LABELS[user.role] || user.role}
            </Badge>
            {(user as any).createdAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar size={10} />
                Joined{" "}
                {format(new Date((user as any).createdAt), "MMM yyyy")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon size={16} /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <UserIcon size={12} /> Full Name
              </Label>
              <Input
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail size={12} /> Email
              </Label>
              <Input value={user.email} disabled className="opacity-60" />
              <p className="text-[10px] text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone size={12} /> Phone Number
              </Label>
              <Input
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Shield size={12} /> Role
              </Label>
              <Input
                value={ROLE_LABELS[user.role] || user.role}
                disabled
                className="opacity-60"
              />
              <p className="text-[10px] text-muted-foreground">
                Managed by the owner
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="gap-2"
            >
              <Save size={14} />
              {profileSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock size={16} /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handlePasswordChange}
              disabled={passwordSaving}
              variant="secondary"
              className="gap-2"
            >
              <Lock size={14} />
              {passwordSaving ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management (Owner only) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={16} /> User Management
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadUsers}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading || allUsers === null ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No users found
              </p>
            ) : (
              <div className="space-y-2">
                {allUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                        {(u.name || u.email)
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate flex items-center gap-1.5">
                          {u.name || u.email.split("@")[0]}
                          {u._id === user?._id && (
                            <span className="text-[10px] text-muted-foreground">
                              (You)
                            </span>
                          )}
                          {u.role === "owner" && (
                            <Crown
                              size={12}
                              className="text-amber-500 shrink-0"
                            />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u._id, v)}
                      disabled={
                        u._id === user?._id || roleUpdating === u._id
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
