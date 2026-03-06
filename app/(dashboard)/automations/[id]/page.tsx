'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TRIGGER_TYPES,
  type AutomationWithRelations,
  type AutomationTriggerType,
  type AutomationActionType,
  type AutomationStatus,
  type UpdateAutomationInput,
} from '@/types/automations';
import {
  AutomationStatusBadge,
  TriggerTypeBadge,
  AutomationFlowView,
} from '@/components/automations';
import { TriggerConfigForm } from '@/components/automations/trigger-config-form';
import { ActionBuilder } from '@/components/automations/action-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Loader2,
  Zap,
  Settings,
  Activity,
  Play,
  Pause,
  Save,
  Eye,
  Clock,
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
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

// =============================================================================
// Schema
// =============================================================================

const automationFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  trigger_type: z.string().min(1, 'Trigger type is required'),
  trigger_config: z.record(z.any()).optional(),
  status: z.enum(['active', 'paused', 'draft', 'archived']),
  run_limit: z.number().min(1).max(1000).nullable().optional(),
  cooldown_seconds: z.number().min(0).max(86400).optional(),
  actions: z.array(z.object({
    id: z.string().optional(),
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

export default function AutomationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;
  const { isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  const [automation, setAutomation] = useState<AutomationWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: {
      name: '',
      description: '',
      trigger_type: '',
      trigger_config: {},
      status: 'draft',
      run_limit: null,
      cooldown_seconds: 0,
      actions: [],
    },
  });

  const selectedTriggerType = form.watch('trigger_type') as AutomationTriggerType;

  // Fetch automation
  const fetchAutomation = useCallback(async () => {
    if (!automationId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/automations/${automationId}?include_actions=true&include_schedule=true&include_webhook=true&include_recent_runs=true`
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Automation not found');
          router.push('/automations');
          return;
        }
        throw new Error('Failed to fetch automation');
      }

      const data = await response.json();
      setAutomation(data);

      // Update form with fetched data
      form.reset({
        name: data.name,
        description: data.description || '',
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config || {},
        status: data.status,
        run_limit: data.run_limit,
        cooldown_seconds: data.cooldown_seconds || 0,
        actions: data.actions?.map((a: { id: string; action_type: string; action_config: unknown; position: number }) => ({
          id: a.id,
          action_type: a.action_type,
          action_config: a.action_config,
          position: a.position,
        })) || [],
      });
    } catch (error) {
      console.error('Error fetching automation:', error);
      toast.error('Failed to load automation');
    } finally {
      setIsLoading(false);
    }
  }, [automationId, form, router]);

  useEffect(() => {
    fetchAutomation();
  }, [fetchAutomation]);

  const handleTriggerSelect = (triggerType: string) => {
    form.setValue('trigger_type', triggerType);
    form.setValue('trigger_config', {});
  };

  const handleSubmit = async (values: AutomationFormValues) => {
    if (!automation) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateAutomationInput = {
        name: values.name,
        description: values.description || undefined,
        trigger_type: values.trigger_type as AutomationTriggerType,
        trigger_config: values.trigger_config || {},
        status: values.status as AutomationStatus,
        run_limit: values.run_limit,
        cooldown_seconds: values.cooldown_seconds,
      };

      // Update automation
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update automation');
      }

      // Update actions (replace all)
      if (values.actions && values.actions.length > 0) {
        const actionsResponse = await fetch(`/api/automations/${automation.id}/actions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actions: values.actions.map((action, index) => ({
              action_type: action.action_type as AutomationActionType,
              action_config: action.action_config,
              position: index,
            })),
          }),
        });

        if (!actionsResponse.ok) {
          console.error('Failed to update actions');
        }
      }

      toast.success('Automation saved');
      fetchAutomation();
    } catch (error) {
      console.error('Error updating automation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update automation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunNow = async () => {
    if (!automation) return;

    try {
      const response = await fetch(`/api/automations/${automation.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_data: { manual: true } }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run automation');
      }

      const result = await response.json();
      toast.success(`Automation started (Run ID: ${result.run.id.slice(0, 8)}...)`);
      fetchAutomation();
    } catch (error) {
      console.error('Error running automation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run automation');
    }
  };

  const handleToggleStatus = async () => {
    if (!automation) return;

    const newStatus = automation.status === 'active' ? 'paused' : 'active';

    try {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(newStatus === 'active' ? 'Automation activated' : 'Automation paused');
      fetchAutomation();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="container py-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Not found
  if (!automation) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Automation Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The automation you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push('/automations')}>
              Back to Automations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = can('automations.update');

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/automations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{automation.name}</h1>
              <AutomationStatusBadge status={automation.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <TriggerTypeBadge triggerType={automation.trigger_type} size="sm" />
              <span>{automation.run_count} runs</span>
              {automation.last_run_at && (
                <span>Last run {formatDistanceToNow(new Date(automation.last_run_at), { addSuffix: true })}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {automation.status !== 'archived' && canEdit && (
            <>
              <Button variant="outline" onClick={handleToggleStatus}>
                {automation.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleRunNow}>
                <Zap className="h-4 w-4 mr-2" />
                Run Now
              </Button>
            </>
          )}
          <Button onClick={() => router.push(`/automations/${automation.id}/runs`)}>
            <Activity className="h-4 w-4 mr-2" />
            View Runs
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AutomationFlowView automation={automation} />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{automation.run_count}</p>
                <p className="text-sm text-muted-foreground">Total Runs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{automation.actions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Actions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{automation.run_limit ?? '∞'}</p>
                <p className="text-sm text-muted-foreground">Daily Limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{automation.cooldown_seconds || 0}s</p>
                <p className="text-sm text-muted-foreground">Cooldown</p>
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {automation.description && (
                <div>
                  <span className="text-muted-foreground">Description:</span>{' '}
                  {automation.description}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                {format(new Date(automation.created_at), 'PPpp')}
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{' '}
                {format(new Date(automation.updated_at), 'PPpp')}
              </div>
              {automation.schedule && (
                <div>
                  <span className="text-muted-foreground">Schedule:</span>{' '}
                  {automation.schedule.cron_expression} ({automation.schedule.timezone})
                </div>
              )}
              {automation.webhook && (
                <div>
                  <span className="text-muted-foreground">Webhook URL:</span>{' '}
                  <code className="text-xs bg-muted px-1 rounded">
                    /api/webhooks/{automation.webhook.webhook_key}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          {canEdit ? (
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Textarea className="resize-none" rows={3} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
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
                                  {...field}
                                  value={field.value ?? 0}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trigger */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Trigger</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        {triggerCategories.map((category) => (
                          <div key={category.name}>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              {category.name}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {category.triggers.map((triggerType) => {
                                const triggerInfo = TRIGGER_TYPES.find((t) => t.type === triggerType);
                                const Icon = triggerIcons[triggerType] || Zap;
                                const isSelected = selectedTriggerType === triggerType;

                                return (
                                  <button
                                    key={triggerType}
                                    type="button"
                                    onClick={() => handleTriggerSelect(triggerType)}
                                    className={cn(
                                      'flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all',
                                      'hover:border-primary hover:bg-primary/5',
                                      isSelected && 'border-primary bg-primary/10 ring-1 ring-primary'
                                    )}
                                  >
                                    <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                                    <span className={cn('text-xs font-medium', isSelected && 'text-primary')}>
                                      {triggerInfo?.label || triggerType}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedTriggerType && (
                        <>
                          <Separator />
                          <TriggerConfigForm triggerType={selectedTriggerType} />
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <ActionBuilder />

                  {/* Submit */}
                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={fetchAutomation} disabled={isSubmitting}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </FormProvider>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">View Only</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have permission to edit this automation.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
