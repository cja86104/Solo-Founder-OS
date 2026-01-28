'use client';

import { cn } from '@/lib/utils';
import type {
  Automation,
  AutomationWithActions,
  AutomationAction,
  AutomationTriggerType,
  AutomationActionType,
} from '@/types/automations';
import { TRIGGER_TYPES, ACTION_TYPES } from '@/types/automations';
import { AutomationStatusBadge, TriggerTypeBadge } from './automation-status-badge';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Zap,
  ArrowDown,
  UserPlus,
  UserCog,
  Tag,
  Handshake,
  ArrowRightLeft,
  Trophy,
  XCircle,
  FileInput,
  MessageSquare,
  CheckSquare,
  ListPlus,
  Clock,
  Webhook,
  Play,
  Mail,
  TagIcon,
  ArrowRight,
  Pencil,
  Timer,
  GitBranch,
  CircleDot,
  Flag,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface AutomationFlowViewProps {
  automation: Automation | AutomationWithActions;
  className?: string;
  compact?: boolean;
}

// =============================================================================
// Icon Maps
// =============================================================================

const triggerIcons: Record<string, React.ElementType> = {
  new_contact: UserPlus,
  contact_updated: UserCog,
  contact_tagged: Tag,
  deal_created: Handshake,
  deal_stage_changed: ArrowRightLeft,
  deal_won: Trophy,
  deal_lost: XCircle,
  form_submitted: FileInput,
  feedback_received: MessageSquare,
  task_completed: CheckSquare,
  task_created: ListPlus,
  scheduled: Clock,
  webhook: Webhook,
  manual: Play,
};

const actionIcons: Record<string, React.ElementType> = {
  send_email: Mail,
  create_task: ListPlus,
  update_contact: UserCog,
  add_tag: Tag,
  remove_tag: TagIcon,
  move_deal: ArrowRight,
  create_deal: Handshake,
  update_deal: Pencil,
  webhook: Webhook,
  delay: Timer,
  condition: GitBranch,
};

// =============================================================================
// Flow Node Component
// =============================================================================

interface FlowNodeProps {
  type: 'trigger' | 'action' | 'end';
  label: string;
  description?: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'muted';
  details?: Record<string, unknown>;
  position?: number;
}

function FlowNode({
  type,
  label,
  description,
  icon: Icon,
  variant = 'default',
  details,
  position,
}: FlowNodeProps) {
  const variantStyles = {
    default: 'border-primary/50 bg-primary/5',
    success: 'border-green-500/50 bg-green-500/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    muted: 'border-muted-foreground/30 bg-muted/30',
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    muted: 'text-muted-foreground',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-default',
              variantStyles[variant]
            )}
          >
            {position !== undefined && (
              <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">
                  {position + 1}
                </span>
              </div>
            )}

            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                variant === 'default' && 'bg-primary/10',
                variant === 'success' && 'bg-green-500/10',
                variant === 'warning' && 'bg-yellow-500/10',
                variant === 'muted' && 'bg-muted'
              )}
            >
              <Icon className={cn('h-5 w-5', iconStyles[variant])} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    type === 'trigger' && 'border-blue-500 text-blue-600',
                    type === 'action' && 'border-primary text-primary',
                    type === 'end' && 'border-green-500 text-green-600'
                  )}
                >
                  {type === 'trigger' ? 'TRIGGER' : type === 'end' ? 'END' : 'ACTION'}
                </Badge>
              </div>
              <p className="text-sm font-medium truncate mt-0.5">{label}</p>
              {description && (
                <p className="text-xs text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
        </TooltipTrigger>
        {details && Object.keys(details).length > 0 && (
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">{label}</p>
              <div className="text-xs space-y-0.5">
                {Object.entries(details).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono truncate max-w-[150px]">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// Connection Arrow
// =============================================================================

function ConnectionArrow() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="w-px h-3 bg-border" />
        <ArrowDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// =============================================================================
// Get Action Description Helper
// =============================================================================

function getActionDescription(action: AutomationAction): string {
  const config = action.action_config as Record<string, unknown>;

  switch (action.action_type) {
    case 'send_email':
      return `To: ${config.to || 'trigger contact'}`;
    case 'create_task':
      return config.title ? `"${String(config.title).slice(0, 30)}..."` : 'Create new task';
    case 'add_tag':
    case 'remove_tag':
      const tags = config.tags as string[] | undefined;
      return tags ? tags.slice(0, 3).join(', ') : 'Tags';
    case 'move_deal':
      return `To stage: ${config.stage_id || 'specified'}`;
    case 'create_deal':
      return config.name ? String(config.name).slice(0, 30) : 'New deal';
    case 'update_contact':
    case 'update_deal':
      const fields = config.fields as Record<string, unknown> | undefined;
      return fields ? `${Object.keys(fields).length} field(s)` : 'Update fields';
    case 'webhook':
      return config.url ? String(config.url).slice(0, 40) : 'HTTP request';
    case 'delay':
      const parts: string[] = [];
      if (config.delay_days) parts.push(`${config.delay_days}d`);
      if (config.delay_hours) parts.push(`${config.delay_hours}h`);
      if (config.delay_minutes) parts.push(`${config.delay_minutes}m`);
      if (config.delay_seconds) parts.push(`${config.delay_seconds}s`);
      return parts.length > 0 ? `Wait ${parts.join(' ')}` : 'Wait';
    case 'condition':
      return `If ${config.field || 'field'} ${config.operator || '?'}`;
    default:
      return '';
  }
}

// =============================================================================
// Main AutomationFlowView Component
// =============================================================================

export function AutomationFlowView({
  automation,
  className,
  compact = false,
}: AutomationFlowViewProps) {
  const actions = 'actions' in automation ? automation.actions : [];
  const triggerInfo = TRIGGER_TYPES.find((t) => t.type === automation.trigger_type);
  const TriggerIcon = triggerIcons[automation.trigger_type] || Zap;

  // Build trigger details for tooltip
  const triggerDetails: Record<string, unknown> = {};
  const triggerConfig = automation.trigger_config as Record<string, unknown>;
  if (triggerConfig) {
    Object.entries(triggerConfig).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        triggerDetails[key] = value;
      }
    });
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <Badge variant="outline" className="gap-1">
          <TriggerIcon className="h-3 w-3" />
          {triggerInfo?.label || automation.trigger_type}
        </Badge>
        {actions.length > 0 && (
          <>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">
              {actions.length} action{actions.length !== 1 ? 's' : ''}
            </Badge>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{automation.name}</CardTitle>
            <CardDescription>
              {automation.description || 'Automation workflow flow'}
            </CardDescription>
          </div>
          <AutomationStatusBadge status={automation.status} size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {/* Start Node */}
          <div className="flex justify-center mb-1">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <CircleDot className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-600">Start</span>
            </div>
          </div>
          
          <ConnectionArrow />

          {/* Trigger Node */}
          <FlowNode
            type="trigger"
            label={triggerInfo?.label || automation.trigger_type}
            description={triggerInfo?.description}
            icon={TriggerIcon}
            variant="default"
            details={Object.keys(triggerDetails).length > 0 ? triggerDetails : undefined}
          />

          {/* Actions */}
          {actions.length > 0 ? (
            actions
              .sort((a, b) => a.position - b.position)
              .map((action, index) => {
                const actionInfo = ACTION_TYPES.find((a) => a.type === action.action_type);
                const ActionIcon = actionIcons[action.action_type] || GitBranch;
                const description = getActionDescription(action);

                // Determine variant based on action type
                let variant: 'default' | 'warning' | 'muted' = 'default';
                if (action.action_type === 'delay') variant = 'warning';
                if (action.action_type === 'condition') variant = 'warning';

                return (
                  <div key={action.id}>
                    <ConnectionArrow />
                    <FlowNode
                      type="action"
                      label={actionInfo?.label || action.action_type}
                      description={description}
                      icon={ActionIcon}
                      variant={variant}
                      position={index}
                      details={action.action_config as Record<string, unknown>}
                    />
                  </div>
                );
              })
          ) : (
            <>
              <ConnectionArrow />
              <div className="text-center py-4 border-2 border-dashed rounded-lg text-muted-foreground">
                <p className="text-sm">No actions configured</p>
                <p className="text-xs">Add actions to complete this automation</p>
              </div>
            </>
          )}

          {/* End Node */}
          <ConnectionArrow />
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border">
              <Flag className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">End</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span>{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
          <span>{automation.run_count} total run{automation.run_count !== 1 ? 's' : ''}</span>
          {automation.run_limit && (
            <span>Limit: {automation.run_limit}/day</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
