'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
  Settings,
  Users,
} from 'lucide-react';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const {
    workspaces,
    currentWorkspace,
    isLoading,
    switchWorkspace,
    canManageSettings,
  } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <Button
        variant="outline"
        className="justify-start gap-2"
        onClick={() => router.push('/workspaces/new')}
      >
        <Plus className="h-4 w-4" />
        Create Workspace
      </Button>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'lifetime':
        return 'default';
      case 'pro':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-2 px-2 hover:bg-accent"
          aria-label="Switch workspace"
        >
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-8 w-8 rounded-md">
              {currentWorkspace.logo_url ? (
                <AvatarImage
                  src={currentWorkspace.logo_url}
                  alt={currentWorkspace.name}
                />
              ) : null}
              <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs font-medium">
                {getInitials(currentWorkspace.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start truncate">
              <span className="truncate text-sm font-medium">
                {currentWorkspace.name}
              </span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                {currentWorkspace.plan} plan
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px]"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>

        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            className="cursor-pointer gap-2 p-2"
            onClick={() => {
              switchWorkspace(workspace.id);
              setOpen(false);
            }}
          >
            <Avatar className="h-8 w-8 rounded-md">
              {workspace.logo_url ? (
                <AvatarImage src={workspace.logo_url} alt={workspace.name} />
              ) : null}
              <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs font-medium">
                {getInitials(workspace.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col truncate">
              <span className="truncate text-sm font-medium">
                {workspace.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {workspace.slug}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={getPlanBadgeVariant(workspace.plan)}
                className="text-[10px] capitalize"
              >
                {workspace.plan}
              </Badge>
              {workspace.id === currentWorkspace.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {canManageSettings && (
          <>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => {
                router.push(`/workspaces/${currentWorkspace.id}/settings`);
                setOpen(false);
              }}
            >
              <Settings className="h-4 w-4" />
              Workspace Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => {
                router.push(`/workspaces/${currentWorkspace.id}/members`);
                setOpen(false);
              }}
            >
              <Users className="h-4 w-4" />
              Manage Members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => {
            router.push('/workspaces');
            setOpen(false);
          }}
        >
          <Building2 className="h-4 w-4" />
          All Workspaces
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => {
            router.push('/workspaces/new');
            setOpen(false);
          }}
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
