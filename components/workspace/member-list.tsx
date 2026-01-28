'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import {
  WorkspaceMemberDetails,
  WorkspaceRole,
  WorkspaceInvite,
} from '@/types/workspace';
import { RoleBadge, RoleSelector } from '@/components/workspace/role-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreHorizontal,
  UserMinus,
  Shield,
  Clock,
  Mail,
  Loader2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// ============================================================================
// Member List Props
// ============================================================================

interface MemberListProps {
  workspaceId: string;
  members: WorkspaceMemberDetails[];
  pendingInvites?: WorkspaceInvite[];
  currentUserId: string;
  isLoading?: boolean;
  onMemberUpdated?: () => void;
  onMemberRemoved?: () => void;
  onInviteCancelled?: () => void;
}

export function MemberList({
  workspaceId,
  members,
  pendingInvites = [],
  currentUserId,
  isLoading = false,
  onMemberUpdated,
  onMemberRemoved,
  onInviteCancelled,
}: MemberListProps) {
  const { canModifyMember, canRemoveMember, getAssignableRoles, role: currentUserRole } = usePermissions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <div className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            workspaceId={workspaceId}
            member={member}
            isCurrentUser={member.user_id === currentUserId}
            canModify={canModifyMember(member.role)}
            canRemove={canRemoveMember(member.role, member.user_id === currentUserId)}
            assignableRoles={getAssignableRoles()}
            onUpdated={onMemberUpdated}
            onRemoved={onMemberRemoved}
          />
        ))}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Invitations ({pendingInvites.length})
          </h3>
          {pendingInvites.map((invite) => (
            <PendingInviteRow
              key={invite.id}
              workspaceId={workspaceId}
              invite={invite}
              canCancel={currentUserRole === 'owner' || currentUserRole === 'admin'}
              onCancelled={onInviteCancelled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Member Row Component
// ============================================================================

interface MemberRowProps {
  workspaceId: string;
  member: WorkspaceMemberDetails;
  isCurrentUser: boolean;
  canModify: boolean;
  canRemove: boolean;
  assignableRoles: WorkspaceRole[];
  onUpdated?: () => void;
  onRemoved?: () => void;
}

function MemberRow({
  workspaceId,
  member,
  isCurrentUser,
  canModify,
  canRemove,
  assignableRoles,
  onUpdated,
  onRemoved,
}: MemberRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleRoleChange = async (newRole: WorkspaceRole) => {
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${member.user_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      toast.success(`Updated ${member.full_name || member.email}'s role to ${newRole}`);
      onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${member.user_id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      toast.success(
        isCurrentUser
          ? 'You have left the workspace'
          : `Removed ${member.full_name || member.email} from workspace`
      );
      onRemoved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsRemoving(false);
      setShowRemoveDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <Avatar className="h-10 w-10">
          {member.avatar_url && (
            <AvatarImage src={member.avatar_url} alt={member.full_name || ''} />
          )}
          <AvatarFallback>
            {getInitials(member.full_name, member.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {member.full_name || member.email}
            </span>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {member.email}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role - either as selector or badge */}
          {canModify && member.role !== 'owner' ? (
            <RoleSelector
              value={member.role}
              onChange={handleRoleChange}
              availableRoles={assignableRoles}
              disabled={isUpdating}
              showDescriptions={false}
            />
          ) : (
            <RoleBadge role={member.role} />
          )}

          {/* Actions menu */}
          {(canModify || canRemove) && member.role !== 'owner' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canModify && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange('admin')}
                      disabled={member.role === 'admin'}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {canRemove && (
                  <DropdownMenuItem
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-destructive"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    {isCurrentUser ? 'Leave Workspace' : 'Remove Member'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Remove confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isCurrentUser ? 'Leave Workspace?' : 'Remove Member?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCurrentUser
                ? 'You will lose access to this workspace and all its data. You can be re-invited later.'
                : `${member.full_name || member.email} will lose access to this workspace immediately.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4 mr-2" />
              )}
              {isCurrentUser ? 'Leave' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Pending Invite Row Component
// ============================================================================

interface PendingInviteRowProps {
  workspaceId: string;
  invite: WorkspaceInvite;
  canCancel: boolean;
  onCancelled?: () => void;
}

function PendingInviteRow({
  workspaceId,
  invite,
  canCancel,
  onCancelled,
}: PendingInviteRowProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/invites/${invite.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }

      toast.success('Invitation cancelled');
      onCancelled?.();
    } catch (err) {
      toast.error('Failed to cancel invitation');
    } finally {
      setIsCancelling(false);
    }
  };

  const isExpired = new Date(invite.expires_at) < new Date();

  return (
    <div className="flex items-center gap-4 p-4 border border-dashed rounded-lg bg-muted/30">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Mail className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{invite.email}</div>
        <div className="text-sm text-muted-foreground">
          {isExpired ? (
            <span className="text-destructive">Expired</span>
          ) : (
            <>
              Expires{' '}
              {formatDistanceToNow(new Date(invite.expires_at), {
                addSuffix: true,
              })}
            </>
          )}
        </div>
      </div>

      <RoleBadge role={invite.role} />

      {canCancel && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
