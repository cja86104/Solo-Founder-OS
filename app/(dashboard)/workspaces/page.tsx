'use client';

import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import {
  Building2,
  Plus,
  Check,
  Settings,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * /workspaces — list of every workspace the current user belongs to.
 *
 * Reached from the WorkspaceSwitcher dropdown's "All Workspaces" item.
 * Per-workspace settings and members live at /workspaces/[id]/settings
 * and /workspaces/[id]/members; this page is the directory + switcher
 * surface, not the per-workspace editor.
 *
 * Replaces a buggy duplicate of the settings page that previously lived
 * at this route — that file called useParams().id (which doesn't exist
 * at /workspaces, only at /workspaces/[id]/settings), causing the page
 * to spin on its loading skeleton forever.
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getPlanBadgeVariant(
  plan: string,
): 'default' | 'secondary' | 'outline' {
  switch (plan) {
    case 'lifetime':
      return 'default';
    case 'pro':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default function WorkspacesListPage() {
  const { workspaces, currentWorkspace, switchWorkspace, isLoading } =
    useWorkspace();

  // Loading state — match the page's max-width and grid shape so the
  // skeleton doesn't shift layout on hydration.
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Zero-state — user has no memberships.
  if (workspaces.length === 0) {
    return (
      <div className="container max-w-3xl py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No workspaces yet</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              You aren&apos;t a member of any workspace. Create one to get
              started, or ask a teammate to invite you.
            </p>
            <Button asChild>
              <Link href="/workspaces/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-7 w-7" />
            Workspaces
          </h1>
          <p className="text-muted-foreground mt-1">
            All workspaces you belong to. Click a workspace to switch, or
            open it to manage settings and members.
          </p>
        </div>
        <Button asChild>
          <Link href="/workspaces/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </Link>
        </Button>
      </div>

      {/* Grid of workspace cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => {
          const isCurrent = workspace.id === currentWorkspace?.id;

          // Whole-card click switches to the workspace. The Switch button
          // is preserved as an explicit affordance for keyboard / screen
          // reader users since the card itself isn't focusable.
          const handleCardClick = () => {
            if (!isCurrent) {
              switchWorkspace(workspace.id);
            }
          };

          return (
            <Card
              key={workspace.id}
              className={
                isCurrent
                  ? 'border-primary/50 ring-1 ring-primary/30'
                  : 'hover:border-primary/30 hover:shadow-sm transition-shadow cursor-pointer'
              }
              onClick={isCurrent ? undefined : handleCardClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-12 w-12 rounded-md">
                      {workspace.logo_url ? (
                        <AvatarImage
                          src={workspace.logo_url}
                          alt={workspace.name}
                        />
                      ) : null}
                      <AvatarFallback className="rounded-md bg-primary/10 text-primary font-medium">
                        {getInitials(workspace.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">
                        {workspace.name}
                      </CardTitle>
                      <CardDescription className="truncate text-xs">
                        {workspace.slug}
                      </CardDescription>
                    </div>
                  </div>
                  {isCurrent && (
                    <Badge variant="default" className="shrink-0 gap-1">
                      <Check className="h-3 w-3" />
                      Current
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {workspace.role}
                  </span>
                  <Badge
                    variant={getPlanBadgeVariant(workspace.plan)}
                    className="capitalize text-[10px]"
                  >
                    {workspace.plan}
                  </Badge>
                </div>

                {/* Stop click propagation on the per-card actions so they
                    don't double-fire the switch handler. */}
                <div
                  className="flex items-center gap-2 pt-2 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isCurrent && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => switchWorkspace(workspace.id)}
                    >
                      Switch
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isCurrent ? 'flex-1' : ''}
                    asChild
                  >
                    <Link
                      href={`/workspaces/${workspace.id}/settings`}
                      aria-label={`Settings for ${workspace.name}`}
                    >
                      <Settings className="h-3.5 w-3.5 mr-1" />
                      Settings
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={`/workspaces/${workspace.id}/members`}
                      aria-label={`Members of ${workspace.name}`}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Members
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
