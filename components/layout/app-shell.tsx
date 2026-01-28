"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile, Subscription } from "@/types/database";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
  subscription: Subscription | null;
}

export function AppShell({ children, user, profile, subscription }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        className="hidden lg:flex"
      />

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <Sidebar
        collapsed={false}
        onCollapsedChange={() => {}}
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onClose={() => setMobileSidebarOpen(false)}
        isMobile
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-[70px]" : "lg:pl-[260px]"
        )}
      >
        <Header
          user={user}
          profile={profile}
          subscription={subscription}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
