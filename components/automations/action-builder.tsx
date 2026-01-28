'use client';

import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { AutomationActionType } from '@/types/automations';
import { ACTION_TYPES } from '@/types/automations';
import { ActionConfigForm } from './action-config-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Mail,
  ListPlus,
  UserCog,
  Tag,
  TagIcon,
  ArrowRight,
  Handshake,
  Pencil,
  Webhook,
  Timer,
  GitBranch,
  ArrowDown,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface ActionBuilderProps {
  className?: string;
}

interface ActionItem {
  id?: string;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  position: number;
}

// =============================================================================
// Action Type Icons
// =============================================================================

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
// Action Category Grouping
// =============================================================================

const actionCategories = [
  {
    name: 'Communication',
    actions: ['send_email'],
  },
  {
    name: 'Data',
    actions: ['create_task', 'update_contact', 'add_tag', 'remove_tag', 'move_deal', 'create_deal', 'update_deal'],
  },
  {
    name: 'Integration',
    actions: ['webhook'],
  },
  {
    name: 'Flow Control',
    actions: ['delay', 'condition'],
  },
];

// =============================================================================
// Action Type Picker Dialog
// =============================================================================

interface ActionTypePickerProps {
  onSelect: (actionType: AutomationActionType) => void;
  trigger: React.ReactNode;
}

function ActionTypePicker({ onSelect, trigger }: ActionTypePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (actionType: AutomationActionType) => {
    onSelect(actionType);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Action</DialogTitle>
          <DialogDescription>
            Choose what action to perform when this automation runs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {actionCategories.map((category) => (
            <div key={category.name}>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {category.name}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {category.actions.map((actionType) => {
                  const actionInfo = ACTION_TYPES.find((a) => a.type === actionType);
                  const Icon = actionIcons[actionType] || GitBranch;

                  return (
                    <button
                      key={actionType}
                      type="button"
                      onClick={() => handleSelect(actionType as AutomationActionType)}
                      className="flex items-center gap-3 p-3 rounded-lg border text-left hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {actionInfo?.label || actionType}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {actionInfo?.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Single Action Item Card
// =============================================================================

interface ActionItemCardProps {
  index: number;
  action: ActionItem;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function ActionItemCard({
  index,
  action,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: ActionItemCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const actionInfo = ACTION_TYPES.find((a) => a.type === action.action_type);
  const Icon = actionIcons[action.action_type] || GitBranch;

  return (
    <div className="relative">
      {/* Connection line */}
      {!isFirst && (
        <div className="absolute left-6 -top-4 w-px h-4 bg-border" />
      )}
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-l-4 border-l-primary/50">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <GripVertical className="h-4 w-4 cursor-grab" />
              </div>
              
              <Badge variant="outline" className="gap-1 font-normal">
                <Icon className="h-3 w-3" />
                {actionInfo?.label || action.action_type}
              </Badge>
              
              <span className="text-xs text-muted-foreground">
                Step {index + 1}
              </span>

              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onMoveUp}
                  disabled={isFirst}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onMoveDown}
                  disabled={isLast}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={onRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4">
              <ActionConfigForm
                actionType={action.action_type}
                fieldPrefix={`actions.${index}.action_config`}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Arrow to next action */}
      {!isLast && (
        <div className="flex justify-center py-2">
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main ActionBuilder Component
// =============================================================================

export function ActionBuilder({ className }: ActionBuilderProps) {
  const form = useFormContext();
  
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'actions',
  });

  const handleAddAction = (actionType: AutomationActionType) => {
    const defaultConfigs: Record<string, Record<string, unknown>> = {
      send_email: { to: 'trigger_contact', subject: '', body: '' },
      create_task: { title: '', priority: 'medium' },
      add_tag: { tags: [] },
      remove_tag: { tags: [] },
      update_contact: { fields: {} },
      move_deal: { stage_id: '' },
      create_deal: { name: '', pipeline_id: '', stage_id: '' },
      update_deal: { fields: {} },
      webhook: { url: '', method: 'POST' },
      delay: { delay_minutes: 5 },
      condition: { field: '', operator: 'equals', value: '' },
    };

    append({
      action_type: actionType,
      action_config: defaultConfigs[actionType] || {},
      position: fields.length,
    });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Actions</span>
          <Badge variant="secondary">{fields.length} action{fields.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <GitBranch className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              No actions configured yet.
              <br />
              Add actions to define what happens when this automation triggers.
            </p>
            <ActionTypePicker
              onSelect={handleAddAction}
              trigger={
                <Button type="button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Action
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <ActionItemCard
                  key={field.id}
                  index={index}
                  action={field as unknown as ActionItem}
                  onRemove={() => remove(index)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                />
              ))}
            </div>

            <ActionTypePicker
              onSelect={handleAddAction}
              trigger={
                <Button type="button" variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
