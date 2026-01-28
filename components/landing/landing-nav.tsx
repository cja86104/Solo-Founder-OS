"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Pages",
    href: "/landing",
    icon: FileText,
    exact: true,
  },
  {
    name: "Leads",
    href: "/landing/leads",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/landing/analytics",
    icon: BarChart3,
  },
];

export function LandingNav() {
  const pathname = usePathname();

  // Don't show nav on editor pages
  if (pathname.match(/^\/landing\/[^/]+$/) && pathname !== "/landing/new" && pathname !== "/landing/leads" && pathname !== "/landing/analytics") {
    return null;
  }

  return (
    <div className="border-b">
      <nav className="flex gap-4" aria-label="Landing pages navigation">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
