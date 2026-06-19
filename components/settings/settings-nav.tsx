"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, Key, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

// NOTE: Workspace/Team navigation is intentionally absent. Workspace-scoped
// settings and member management live at /workspaces/[id]/settings and
// /workspaces/[id]/members, reachable via the WorkspaceSwitcher dropdown in
// the sidebar. /settings/workspace is a legacy redirect to that canonical
// surface and should not be linked from any nav.
const navItems = [
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Billing", href: "/settings/billing", icon: CreditCard },
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
