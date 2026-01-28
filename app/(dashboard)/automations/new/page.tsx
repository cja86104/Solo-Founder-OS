'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  AutomationTriggerType,
  AutomationActionType,
  CreateAutomationInput,
} from '@/types/automations';
import { TRIGGER_TYPES } from '@/types/automations';
import { TriggerConfigForm } from '@/components/automations/trigger-config-form';
import { ActionBuilder } from '@/components/automations/action-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Loader2,
  Zap,
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
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Schema
// =============================================================================

const automationFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  trigger_type: z.string().min(1, 'Trigger type is required'),
  trigger_config: z.record(z.any()).optional(),
  run_limit: z.number().min(1).max(1000).nullable().optional(),
  cooldown_seconds: z.number().min(0).max(86400).optional(),
  actions: z.array(z.object({
    action_type: z.string(),
    action_config: z.record(z.any()),
    position: z.number(),
  })).optional(),
});

type AutomationFormValues = z.infer<typeof automationFormSchema>;

// =============================================================================
// Trigger Icons
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

// =============================================================================
// Trigger Categories
// =============================================================================

const triggerCategories = [
  { name: 'Contacts', triggers: ['new_contact', 'contact_updated', 'contact_tagged'] },
  { name: 'Deals', triggers: ['deal_created', 'deal_stage_changed', 'deal_won', 'deal_lost'] },
  { name: 'Content', triggers: ['form_submitted', 'feedback_received'] },
  { name: 'Projects', triggers: ['task_completed', 'task_created'] },
  { name: 'System', triggers: ['scheduled', 'webhook', 'manual'] },
];

// =============================================================================
// Page Component
// =============================================================================

export default function NewAutomationPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: {
      name: '',
      description: '',
      trigger_type: '',
      trigger_config: {},
      run_limit: null,
      cooldown_seconds: 0,
      actions: [],
    },
  });

  const selectedTriggerType = form.watch('trigger_type') as AutomationTriggerType;

  const handleTriggerSelect = (triggerType: string) => {
    form.setValue('trigger_type', triggerType);
    form.setValue('trigger_config', {});
  };

  const handleSubmit = async (values: AutomationFormValues) => {
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAutomationInput & { workspace_id: string; actions?: any[] } = {
        workspace_id: currentWorkspace.id,
        name: values.name,
        description: values.description || undefined,
        trigger_type: values.trigger_type as AutomationTriggerType,
        trigger_config: values.trigger_config || {},
        status: 'draft',
        run_limit: values.run_limit,
        cooldown_seconds: values.cooldown_seconds,
        actions: values.actions?.map((action, index) => ({
          action_type: action.action_type as AutomationActionType,
          action_config: action.action_config,
          position: index,
        })),
      };

      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create automation');
      }

      const result = await response.json();
      toast.success('Automation created successfully');
      router.push(`/automations/${result.id}`);
    } catch (error) {
      console.error('Error creating automation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create automation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permission check
  if (!workspaceLoading && !can('content.create')) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don&apos;t have permission to create automations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Automation</h1>
          <p className="text-muted-foreground">
            Set up a new automated workflow
          </p>
        </div>
      </div>

      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Give your automation a name and description.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Welcome new contacts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this automation does..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="run_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Run Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : null)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Max runs per day (leave empty for unlimited)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cooldown_seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooldown (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum time between runs
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trigger Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Trigger</CardTitle>
                <CardDescription>
                  Choose what event will start this automation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="trigger_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Trigger Type</FormLabel>
                      <div className="space-y-4">
                        {triggerCategories.map((category) => (
                          <div key={category.name}>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              {category.name}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {category.triggers.map((triggerType) => {
                                const triggerInfo = TRIGGER_TYPES.find(
                                  (t) => t.type === triggerType
                                );
                                const Icon = triggerIcons[triggerType] || Zap;
                                const isSelected = field.value === triggerType;

                                return (
                                  <button
                                    key={triggerType}
                                    type="button"
                                    onClick={() => handleTriggerSelect(triggerType)}
                                    className={cn(
                                      'flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all',
                                      'hover:border-primary hover:bg-primary/5',
                                      isSelected &&
                                        'border-primary bg-primary/10 ring-1 ring-primary'
                                    )}
                                  >
                                    <Icon
                                      className={cn(
                                        'h-5 w-5',
                                        isSelected ? 'text-primary' : 'text-muted-foreground'
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        'text-xs font-medium',
                                        isSelected && 'text-primary'
                                      )}
                                    >
                                      {triggerInfo?.label || triggerType}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Trigger Configuration */}
                {selectedTriggerType && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Trigger Configuration</h4>
                      <TriggerConfigForm triggerType={selectedTriggerType} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <ActionBuilder />

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedTriggerType}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Automation
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  );
}
