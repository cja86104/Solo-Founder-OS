'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { MemberList } from '@/components/workspace/member-list';
import { InviteMemberDialog } from '@/components/workspace/invite-member-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  ArrowLeft,
  UserPlus,
  AlertTriangle,
  Crown,
  Shield,
  Pencil,
  Eye,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  WorkspaceMemberDetails,
  WorkspaceInvite,
  WorkspaceWithRole,
  PLAN_LIMITS,
  formatLimit,
} from '@/types/workspace';

export default function WorkspaceMembersPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const supabase = createClient();

  const { workspaces, isLoading: contextLoading } = useWorkspace();
  const { canManageTeam, isOwner, isAdmin } = usePermissions();

  const [workspace, setWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberDetails[]>([]);
  const [pendingInvites, setPendingInvites] = useState<WorkspaceInvite[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get workspace from context
  useEffect(() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setWorkspace(ws);
    } else if (!contextLoading) {
      router.push('/workspaces');
    }
  }, [workspaces, workspaceId, contextLoading, router]);

  // Get current user
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    getUser();
  }, [supabase]);

  // Fetch members and invites
  const fetchData = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch members
      const membersRes = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!membersRes.ok) {
        throw new Error('Failed to fetch members');
      }
      const membersData = await membersRes.json();
      setMembers(membersData.members || []);

      // Fetch invites
      const invitesRes = await fetch(`/api/workspaces/${workspaceId}/invites`);
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setPendingInvites(invitesData.invites || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId, fetchData]);

  // Check member limits
  const memberLimit = workspace?.plan_limits?.team_members ?? 0;
  const currentMemberCount = members.length;
  const pendingCount = pendingInvites.length;
  const isAtLimit =
    memberLimit !== -1 && currentMemberCount + pendingCount >= memberLimit + 1; // +1 for owner

  // Role distribution
  const roleDistribution = members.reduce(
    (acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (contextLoading || !workspace) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    );
  }

  if (!canManageTeam) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You don&apos;t have permission to manage team members. Contact the
              workspace owner for access.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/workspaces">Back to Workspaces</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workspaces">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Members
          </h1>
          <p className="text-muted-foreground">{workspace.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {!isAtLimit && (
            <InviteMemberDialog
              workspaceId={workspaceId}
              onInviteSent={fetchData}
            />
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex justify-center mb-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold">{roleDistribution.owner || 0}</div>
                <div className="text-sm text-muted-foreground">Owner</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex justify-center mb-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{roleDistribution.admin || 0}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex justify-center mb-2">
                  <Pencil className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{roleDistribution.editor || 0}</div>
                <div className="text-sm text-muted-foreground">Editors</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex justify-center mb-2">
                  <Eye className="h-5 w-5 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">{roleDistribution.viewer || 0}</div>
                <div className="text-sm text-muted-foreground">Viewers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Limit Warning */}
        {workspace.plan === 'free' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Free plan includes the owner only. Upgrade to Pro for up to 5 team
                members.
              </span>
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings/billing">Upgrade</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isAtLimit && workspace.plan !== 'lifetime' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                You&apos;ve reached your team member limit (
                {formatLimit(memberLimit)} members).
              </span>
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings/billing">Upgrade</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Members Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  {currentMemberCount} member{currentMemberCount !== 1 ? 's' : ''}
                  {pendingCount > 0 && ` • ${pendingCount} pending`}
                </CardDescription>
              </div>
              {memberLimit !== -1 && (
                <Badge variant="outline">
                  {currentMemberCount}/{memberLimit + 1} seats used
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <MemberList
              workspaceId={workspaceId}
              members={members}
              pendingInvites={pendingInvites}
              currentUserId={currentUserId || ''}
              isLoading={isLoading}
              onMemberUpdated={fetchData}
              onMemberRemoved={fetchData}
              onInviteCancelled={fetchData}
            />
          </CardContent>
        </Card>

        {/* Empty State for Invites */}
        {!isLoading && members.length === 1 && pendingInvites.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Build Your Team</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Invite team members to collaborate on your workspace. They&apos;ll
                get access based on the role you assign.
              </p>
              {!isAtLimit && (
                <InviteMemberDialog
                  workspaceId={workspaceId}
                  onInviteSent={fetchData}
                >
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Your First Member
                  </Button>
                </InviteMemberDialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
