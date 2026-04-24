"use client";

import { useAuth } from "@/components/providers/auth";

export type UserRole = "owner" | "manager" | "operator";

export function useUserRole() {
  const { user, isLoading } = useAuth();

  return {
    user,
    isLoading,
    isOwner: user?.role === "owner",
    isManager: user?.role === "manager" || user?.role === "owner",
    isOperator: true,
    hasRole: (roles: UserRole[]) =>
      user?.role ? roles.includes(user.role) : false,
    role: user?.role as UserRole | undefined,
  };
}
