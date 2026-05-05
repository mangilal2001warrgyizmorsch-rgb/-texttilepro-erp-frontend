"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Factory, ChevronRight, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuth } from "@/components/providers/auth";
import { ThemeToggle } from "./ThemeToggle";
import {
  Users, Code2, Scissors, Star, ShoppingCart, FileText, Layers,
  MapPin, Stamp, Send, ClipboardList, Truck, Receipt,
  LayoutDashboard, ShieldCheck, RefreshCw,
} from "lucide-react";

type NavItem = { label: string; icon: React.ReactNode; href: string };

const navGroups: { title: string; items: NavItem[]; ownerOnly?: boolean }[] = [
  { title: "Overview", items: [{ label: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/" }] },
  { title: "Owner", ownerOnly: true, items: [{ label: "Owner Dashboard", icon: <ShieldCheck size={16} />, href: "/owner/dashboard" }] },
  {
    title: "Masters", items: [
      { label: "Account Master", icon: <Users size={16} />, href: "/masters/accounts" },
      { label: "Code Master", icon: <Code2 size={16} />, href: "/masters/codes" },
      { label: "Quality Master", icon: <Star size={16} />, href: "/masters/qualities" },
    ],
  },
  {
    title: "Transactions", items: [
      { label: "Order Entry", icon: <ShoppingCart size={16} />, href: "/orders" },
      { label: "Party Challan", icon: <FileText size={16} />, href: "/challans" },
      { label: "Lot Creation", icon: <Layers size={16} />, href: "/lots" },
    ],
  },
  {
    title: "Inventory", items: [
      { label: "Location Master", icon: <MapPin size={16} />, href: "/locations" },
      { label: "Location Dashboard", icon: <LayoutDashboard size={16} />, href: "/location-dashboard" },
    ],
  },
  {
    title: "Production", items: [
      { label: "Stamping", icon: <Stamp size={16} />, href: "/stamping" },
      { label: "Send to Process", icon: <Send size={16} />, href: "/process-issue" },
      { label: "Job Card", icon: <ClipboardList size={16} />, href: "/job-cards" },
      { label: "Finish Meter Entry", icon: <RefreshCw size={16} />, href: "/production" },
    ],
  },
  {
    title: "Dispatch & Billing", items: [
      { label: "Ready for Dispatch", icon: <Truck size={16} />, href: "/dispatch" },
      { label: "Billing", icon: <Receipt size={16} />, href: "/billing" },
    ],
  },
];

const ROLE_COLORS: Record<string, string> = {
  owner: "text-amber-500",
  manager: "text-blue-400",
  operator: "text-slate-400",
};

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { isOwner } = useUserRole();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const initials = user
    ? (user.name || user.email)
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b z-50 sticky top-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Factory size={16} className="text-primary-foreground" />
        </div>
        <span className="font-bold text-lg leading-tight tracking-tight">TextilePro</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu size={20} />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Access all pages in the application.</SheetDescription>
          
          <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Factory size={16} className="text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">TextilePro</p>
                <p className="text-[10px] text-sidebar-foreground/50 leading-tight">Dyeing & Printing ERP</p>
              </div>
            </div>
            {/* The default close button of Sheet Content is absolute, so we can hide the default one in css or just let it be. But Radix UI provides a default close button. Let's rely on it or add our own if needed. Radix's default close button is fine. */}
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
            {navGroups.map((group) => {
              if (group.ownerOnly && !isOwner) return null;
              return (
                <div key={group.title}>
                  <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-1">{group.title}</p>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="border-t border-sidebar-border shrink-0">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 hover:bg-sidebar-accent/50 transition-colors cursor-pointer group",
                pathname === "/profile" && "bg-sidebar-accent/50"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                  {user?.name || "User"}
                </p>
                <p className={cn("text-[10px] font-medium capitalize", ROLE_COLORS[user?.role || "operator"])}>
                  {user?.role || "operator"}
                </p>
              </div>
              <ChevronRight size={14} className="text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors shrink-0" />
            </Link>
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 hover:bg-destructive/20 hover:text-destructive transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
              <p className="text-[10px] text-sidebar-foreground/30">v1.0.0</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
