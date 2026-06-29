"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  LayoutDashboard,
  Code2,
  FileText,
  MessageSquare,
  BarChart3,
  Users,
  PenTool,
  FolderKanban,
  Zap,
  Brain,
  LineChart,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { FoundersHelmIcon } from "@/components/founders-helm-icon";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { useHelpDrawer } from "@/components/layout/help-drawer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
}

// Two upper groups are pure-link navigation. The Account group is rendered
// separately at the bottom because it now mixes a Link (Settings) with an
// action button (Operations Manual) — the renderer below handles both.
const navigation = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Products",
    items: [
      { name: "Code Vault", href: "/vault", icon: Code2 },
      { name: "Landing Pages", href: "/landing", icon: FileText },
      { name: "Feedback", href: "/feedback", icon: MessageSquare },
      { name: "Command Center", href: "/command", icon: BarChart3 },
      { name: "CRM", href: "/crm", icon: Users },
      { name: "Content Engine", href: "/content", icon: PenTool },
      { name: "Projects", href: "/projects", icon: FolderKanban },
      { name: "Automations", href: "/automations", icon: Zap },
      { name: "AI Advisor", href: "/advisor", icon: Brain },
      { name: "Insights", href: "/analytics", icon: LineChart },
    ],
  },
];

// Shared className for any sidebar row (link or button) so the Settings
// Link and the Operations Manual button stay visually identical.
function rowClasses(
  isActive: boolean,
  collapsed: boolean,
): string {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    collapsed && "justify-center px-2",
  );
}

interface RowProps {
  name: string;
  icon: LucideIcon;
  collapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

// Manual trigger row — looks the same as a nav link but fires the drawer
// instead of routing.
function OperationsManualRow({ name, icon: Icon, collapsed, isMobile, onClose }: RowProps) {
  const { openHelp } = useHelpDrawer();

  const handleClick = () => {
    if (isMobile) onClose?.();
    openHelp();
  };

  const content = (
    <button
      type="button"
      onClick={handleClick}
      className={rowClasses(false, collapsed)}
      aria-label={name}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="truncate text-left">{name}</span>}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {name}
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  className,
  onClose,
  isMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-[70px]" : "w-[260px]",
          className
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center flex-shrink-0">
              <FoundersHelmIcon className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg truncate">Founders Helm</span>
            )}
          </Link>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Workspace Switcher */}
        <div
          className={cn(
            "border-b p-2",
            collapsed && "flex justify-center px-1"
          )}
        >
          <WorkspaceSwitcher collapsed={collapsed} />
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-2">
            {navigation.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h4>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    const linkContent = (
                      <Link
                        href={item.href}
                        onClick={() => isMobile && onClose?.()}
                        className={rowClasses(isActive, collapsed)}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={10}>
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.href}>{linkContent}</div>;
                  })}
                </div>
              </div>
            ))}

            {/* Account group — hand-rendered because it mixes a Link
                (Settings) with an action button (Operations Manual). */}
            <div>
              {!collapsed && (
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </h4>
              )}
              <div className="space-y-1">
                {/* Settings link */}
                {(() => {
                  const settingsLink = (
                    <Link
                      href="/settings"
                      onClick={() => isMobile && onClose?.()}
                      className={rowClasses(settingsActive, collapsed)}
                    >
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">Settings</span>}
                    </Link>
                  );
                  if (collapsed) {
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                          Settings
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return <div>{settingsLink}</div>;
                })()}

                {/* Operations Manual — opens the help drawer */}
                <OperationsManualRow
                  name="Operations Manual"
                  icon={BookOpen}
                  collapsed={collapsed}
                  isMobile={isMobile}
                  onClose={onClose}
                />
              </div>
            </div>
          </nav>
        </ScrollArea>

        {/* Collapse Button (Desktop only) */}
        {!isMobile && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => onCollapsedChange(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
