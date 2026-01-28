'use client';

import { WorkspaceRole, ROLE_DESCRIPTIONS } from '@/types/workspace';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Pencil, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Role Icon Component
// ============================================================================

interface RoleIconProps {
  role: WorkspaceRole;
  className?: string;
}

export function RoleIcon({ role, className }: RoleIconProps) {
  const icons: Record<WorkspaceRole, React.ReactNode> = {
    owner: <Crown className={cn('h-4 w-4', className)} />,
    admin: <Shield className={cn('h-4 w-4', className)} />,
    editor: <Pencil className={cn('h-4 w-4', className)} />,
    viewer: <Eye className={cn('h-4 w-4', className)} />,
  };
  return <>{icons[role]}</>;
}

// ============================================================================
// Role Badge Component
// ============================================================================

interface RoleBadgeProps {
  role: WorkspaceRole;
  showIcon?: boolean;
  className?: string;
}

export function RoleBadge({ role, showIcon = true, className }: RoleBadgeProps) {
  const variants: Record<WorkspaceRole, 'default' | 'secondary' | 'outline'> = {
    owner: 'default',
    admin: 'secondary',
    editor: 'outline',
    viewer: 'outline',
  };

  return (
    <Badge variant={variants[role]} className={cn('capitalize gap-1', className)}>
      {showIcon && <RoleIcon role={role} className="h-3 w-3" />}
      {role}
    </Badge>
  );
}

// ============================================================================
// Role Selector Component
// ============================================================================

interface RoleSelectorProps {
  value: WorkspaceRole;
  onChange: (role: WorkspaceRole) => void;
  availableRoles?: WorkspaceRole[];
  disabled?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

export function RoleSelector({
  value,
  onChange,
  availableRoles = ['admin', 'editor', 'viewer'],
  disabled = false,
  showDescriptions = true,
  className,
}: RoleSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as WorkspaceRole)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-[180px]', className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <RoleIcon role={value} />
            <span className="capitalize">{value}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => (
          <SelectItem key={role} value={role}>
            <div className="flex items-start gap-3 py-1">
              <RoleIcon role={role} className="mt-0.5" />
              <div>
                <div className="font-medium capitalize">{role}</div>
                {showDescriptions && (
                  <div className="text-xs text-muted-foreground max-w-[200px]">
                    {ROLE_DESCRIPTIONS[role]}
                  </div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Role Radio Group (Alternative UI)
// ============================================================================

interface RoleRadioGroupProps {
  value: WorkspaceRole;
  onChange: (role: WorkspaceRole) => void;
  availableRoles?: WorkspaceRole[];
  disabled?: boolean;
  className?: string;
}

export function RoleRadioGroup({
  value,
  onChange,
  availableRoles = ['admin', 'editor', 'viewer'],
  disabled = false,
  className,
}: RoleRadioGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {availableRoles.map((role) => (
        <label
          key={role}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
            value === role
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="radio"
            name="role"
            value={role}
            checked={value === role}
            onChange={(e) => onChange(e.target.value as WorkspaceRole)}
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <RoleIcon role={role} />
              <span className="font-medium capitalize">{role}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}
