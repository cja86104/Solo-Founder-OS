"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Profile, Subscription } from "@/types/database";
import {
  User as UserIcon,
  Settings,
  CreditCard,
  Users,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  user: User;
  profile: Profile | null;
  subscription: Subscription | null;
}

export function UserMenu({ user, profile, subscription }: UserMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch with Radix UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const isAdmin = profile?.role === "admin";

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };

  // Render placeholder until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <Avatar>
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <Badge className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500">
                <Sparkles className="h-3 w-3 mr-1" />
                Full Access
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/workspace">
              <Users className="mr-2 h-4 w-4" />
              Team
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Shield className="mr-2 h-4 w-4" />
                Admin Settings
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
