"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, Users, Key, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Billing", href: "/settings/billing", icon: CreditCard },
  { name: "Team", href: "/settings/team", icon: Users },
  { name: "API Keys", href: "/settings/api-keys", icon: Key },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
