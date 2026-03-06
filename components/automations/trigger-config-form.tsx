'use client';

import { useFormContext } from 'react-hook-form';
import type { AutomationTriggerType } from '@/types/automations';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X, Info } from 'lucide-react';
import { useState } from 'react';

// =============================================================================
// Types
// =============================================================================

interface TriggerConfigFormProps {
  triggerType: AutomationTriggerType;
}

// =============================================================================
// Tag Input Helper Component
// =============================================================================

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

function TagInput({ value, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    </div>
  );
}

// =============================================================================
// Common Cron Presets
// =============================================================================

const cronPresets = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9am', value: '0 9 * * *' },
  { label: 'Every Monday at 9am', value: '0 9 * * 1' },
  { label: 'First of month at 9am', value: '0 9 1 * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
];

// =============================================================================
// Timezone Options
// =============================================================================

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

// =============================================================================
// Main Component
// =============================================================================

export function TriggerConfigForm({ triggerType }: TriggerConfigFormProps) {
  const form = useFormContext();

  // =========================================================================
  // New Contact Trigger Config
  // =========================================================================
  if (triggerType === 'new_contact') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.source_filter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Filter (optional)</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add source (e.g., 'website', 'import')..."
                />
              </FormControl>
              <FormDescription>
                Only trigger for contacts from these sources. Leave empty for all.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.tag_filter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag Filter (optional)</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add tag..."
                />
              </FormControl>
              <FormDescription>
                Only trigger if contact has these tags.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Contact Updated Trigger Config
  // =========================================================================
  if (triggerType === 'contact_updated') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.fields_to_watch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fields to Watch (optional)</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add field name (e.g., 'email', 'company')..."
                />
              </FormControl>
              <FormDescription>
                Only trigger when these specific fields change. Leave empty to trigger on any change.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Contact Tagged Trigger Config
  // =========================================================================
  if (triggerType === 'contact_tagged') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags to Watch *</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add tag to watch..."
                />
              </FormControl>
              <FormDescription>
                Trigger when any of these tags are added to a contact.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.match_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Match Mode</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'any'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select match mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="any">Any tag (OR)</SelectItem>
                  <SelectItem value="all">All tags (AND)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                &quot;Any&quot; triggers if any tag matches. &quot;All&quot; requires all tags.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Deal Created Trigger Config
  // =========================================================================
  if (triggerType === 'deal_created') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.pipeline_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pipeline (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Pipeline ID (leave empty for all)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Only trigger for deals in this pipeline.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.min_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Deal Value (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>
                Only trigger for deals with value greater than or equal to this amount.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Deal Stage Changed Trigger Config
  // =========================================================================
  if (triggerType === 'deal_stage_changed') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.pipeline_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pipeline (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Pipeline ID (leave empty for all)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.from_stage_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Stage (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Stage ID (leave empty for any)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Only trigger when moving FROM this stage.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.to_stage_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To Stage (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Stage ID (leave empty for any)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Only trigger when moving TO this stage.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Deal Won/Lost Trigger Config
  // =========================================================================
  if (triggerType === 'deal_won' || triggerType === 'deal_lost') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.pipeline_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pipeline (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Pipeline ID (leave empty for all)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.min_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Deal Value (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Form Submitted Trigger Config
  // =========================================================================
  if (triggerType === 'form_submitted') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.landing_page_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Landing Page (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Landing Page ID (leave empty for all)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Only trigger for submissions from this landing page.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Feedback Received Trigger Config
  // =========================================================================
  if (triggerType === 'feedback_received') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.widget_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback Widget (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Widget ID (leave empty for all)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="trigger_config.min_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Rating</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="1">1 star</SelectItem>
                    <SelectItem value="2">2 stars</SelectItem>
                    <SelectItem value="3">3 stars</SelectItem>
                    <SelectItem value="4">4 stars</SelectItem>
                    <SelectItem value="5">5 stars</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trigger_config.max_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Rating</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="1">1 star</SelectItem>
                    <SelectItem value="2">2 stars</SelectItem>
                    <SelectItem value="3">3 stars</SelectItem>
                    <SelectItem value="4">4 stars</SelectItem>
                    <SelectItem value="5">5 stars</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <FormDescription>
          Use rating filters to trigger only for specific feedback scores (e.g., low ratings for follow-up).
        </FormDescription>
      </div>
    );
  }

  // =========================================================================
  // Task Completed/Created Trigger Config
  // =========================================================================
  if (triggerType === 'task_completed' || triggerType === 'task_created') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Project ID (leave empty for all)"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {triggerType === 'task_completed' && (
          <FormField
            control={form.control}
            name="trigger_config.priority_filter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority Filter (optional)</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add priority (e.g., 'high', 'urgent')..."
                  />
                </FormControl>
                <FormDescription>
                  Only trigger for tasks with these priorities.
                </FormDescription>
              </FormItem>
            )}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // Scheduled Trigger Config
  // =========================================================================
  if (triggerType === 'scheduled') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="trigger_config.cron_expression"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule *</FormLabel>
              <div className="space-y-2">
                <Select
                  onValueChange={(v) => {
                    if (v) field.onChange(v);
                  }}
                  value=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Quick presets..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cronPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormControl>
                  <Input
                    placeholder="0 9 * * 1 (cron expression)"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
              </div>
              <FormDescription>
                Enter a cron expression or select a preset. Format: minute hour day month weekday
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'UTC'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Webhook Trigger Config
  // =========================================================================
  if (triggerType === 'webhook') {
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-muted">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              A unique webhook URL will be generated when you save this automation.
              External services can POST data to this URL to trigger the automation.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="trigger_config.require_signature"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Require Signature</FormLabel>
                <FormDescription>
                  Verify webhook requests using HMAC signature for security.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_config.allowed_ips"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allowed IPs (optional)</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add IP address..."
                />
              </FormControl>
              <FormDescription>
                Restrict webhook to these IP addresses. Leave empty to allow all.
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Manual Trigger Config (no config needed)
  // =========================================================================
  if (triggerType === 'manual') {
    return (
      <div className="p-4 rounded-lg bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          Manual triggers don&apos;t require any configuration.
          <br />
          You&apos;ll be able to run this automation manually from the dashboard.
        </p>
      </div>
    );
  }

  // Fallback for unknown trigger types
  return (
    <div className="p-4 rounded-lg bg-muted/50 text-center">
      <p className="text-sm text-muted-foreground">
        No configuration options available for this trigger type.
      </p>
    </div>
  );
}
