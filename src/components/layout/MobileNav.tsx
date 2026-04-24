"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Layers, Factory, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { label: "Home", icon: <LayoutDashboard size={20} />, href: "/" },
  { label: "Orders", icon: <ShoppingCart size={20} />, href: "/orders" },
  { label: "Lots", icon: <Layers size={20} />, href: "/lots" },
  { label: "Production", icon: <Factory size={20} />, href: "/production" },
  { label: "Billing", icon: <Receipt size={20} />, href: "/billing" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-background md:hidden z-50 pb-safe">
      {mobileLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link key={link.href} href={link.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors cursor-pointer",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
