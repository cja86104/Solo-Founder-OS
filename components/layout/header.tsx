"use client";

import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, Subscription } from "@/types/database";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CommandMenu } from "@/components/layout/command-menu";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

interface HeaderProps {
  user: User;
  profile: Profile | null;
  subscription: Subscription | null;
  onMenuClick: () => void;
}

export function Header({ user, profile, subscription, onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Breadcrumbs */}
      <Breadcrumbs pathname={pathname} />

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Command Menu Trigger */}
        <CommandMenu />

        {/* Search Button (Mobile) */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <UserMenu user={user} profile={profile} subscription={subscription} />
      </div>
    </header>
  );
}
