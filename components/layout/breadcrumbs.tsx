"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  pathname: string;
  className?: string;
}

// Map of path segments to display names
const pathNames: Record<string, string> = {
  dashboard: "Dashboard",
  vault: "Code Vault",
  landing: "Landing Pages",
  feedback: "Feedback",
  command: "Command Center",
  crm: "CRM",
  content: "Content Engine",
  projects: "Projects",
  advisor: "AI Advisor",
  analytics: "Insights",
  settings: "Settings",
  profile: "Profile",
  billing: "Billing",
  team: "Team",
  "api-keys": "API Keys",
  notifications: "Notifications",
  admin: "Admin",
  users: "Users",
  subscriptions: "Subscriptions",
  new: "New",
  edit: "Edit",
  contacts: "Contacts",
  companies: "Companies",
  deals: "Deals",
  activities: "Activities",
  customers: "Customers",
  revenue: "Revenue",
  tickets: "Tickets",
  create: "Create",
  calendar: "Calendar",
  templates: "Templates",
  clients: "Clients",
  invoices: "Invoices",
  chat: "Chat",
  scenarios: "Scenarios",
  reports: "Reports",
  goals: "Goals",
  collections: "Collections",
  roadmap: "Roadmap",
};

export function Breadcrumbs({ pathname, className }: BreadcrumbsProps) {
  // Split pathname and filter empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on root dashboard
  if (segments.length === 1 && segments[0] === "dashboard") {
    return (
      <div className={cn("flex items-center text-sm", className)}>
        <span className="font-medium">Dashboard</span>
      </div>
    );
  }

  return (
    <nav className={cn("flex items-center text-sm", className)}>
      <ol className="flex items-center gap-1">
        <li>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          // Build the href for this segment
          const href = `/${segments.slice(0, index + 1).join("/")}`;

          // Check if this is the last segment
          const isLast = index === segments.length - 1;

          // Check if segment is a UUID (for dynamic routes)
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              segment
            );

          // Get display name
          const displayName = isUuid
            ? "Details"
            : pathNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {isLast ? (
                <span className="font-medium">{displayName}</span>
              ) : (
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
