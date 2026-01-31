"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Code2,
  FileText,
  MessageSquare,
  BarChart3,
  Users,
  PenTool,
  FolderKanban,
  Brain,
  LineChart,
  Settings,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Code Vault", href: "/vault", icon: Code2 },
  { name: "Landing Pages", href: "/landing", icon: FileText },
  { name: "Feedback", href: "/feedback", icon: MessageSquare },
  { name: "Command Center", href: "/command", icon: BarChart3 },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Content Engine", href: "/content", icon: PenTool },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "AI Advisor", href: "/advisor", icon: Brain },
  { name: "Insights", href: "/analytics", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { name: "New Snippet", href: "/vault/new", icon: Plus },
  { name: "New Landing Page", href: "/landing/new", icon: Plus },
  { name: "New Contact", href: "/crm", icon: Plus },
  { name: "New Project", href: "/projects", icon: Plus },
  { name: "New Content", href: "/content", icon: Plus },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            {quickActions.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
