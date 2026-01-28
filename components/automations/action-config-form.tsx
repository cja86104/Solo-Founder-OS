'use client';

import { useFormContext } from 'react-hook-form';
import type { AutomationActionType } from '@/types/automations';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus, Info, Variable } from 'lucide-react';
import { useState } from 'react';

// =============================================================================
// Types
// =============================================================================

interface ActionConfigFormProps {
  actionType: AutomationActionType;
  fieldPrefix: string; // e.g., "actions.0.action_config"
}

// =============================================================================
// Tag Input Helper Component
// =============================================================================

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

function TagInput({ value = [], onChange, placeholder = 'Add item...' }: TagInputProps) {
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
      <div className="flex flex-wrap gap-1 min-h-[24px]">
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
// Key-Value Input for headers/fields
// =============================================================================

interface KeyValueInputProps {
  value: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

function KeyValueInput({
  value = {},
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueInputProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const entries = Object.entries(value || {});

  const addEntry = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({ ...value, [newKey.trim()]: newValue.trim() });
      setNewKey('');
      setNewValue('');
    }
  };

  const removeEntry = (key: string) => {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <Input value={key} disabled className="flex-1 bg-muted" />
          <Input value={val} disabled className="flex-1 bg-muted" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEntry(key)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={keyPlaceholder}
          className="flex-1"
        />
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={valuePlaceholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={addEntry}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Variable Helper Info
// =============================================================================

function VariableHint() {
  return (
    <div className="flex items-start gap-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
      <Variable className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
      <span>
        Use <code className="px-1 bg-muted rounded">{'{{variable}}'}</code> syntax
        to insert trigger data. Examples:{' '}
        <code className="px-1 bg-muted rounded">{'{{contact.email}}'}</code>,{' '}
        <code className="px-1 bg-muted rounded">{'{{deal.name}}'}</code>
      </span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ActionConfigForm({ actionType, fieldPrefix }: ActionConfigFormProps) {
  const form = useFormContext();

  // =========================================================================
  // Send Email Action Config
  // =========================================================================
  if (actionType === 'send_email') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.to`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Send To *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'trigger_contact'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="trigger_contact">Trigger Contact</SelectItem>
                  <SelectItem value="workspace_owner">Workspace Owner</SelectItem>
                  <SelectItem value="custom">Custom Email</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {form.watch(`${fieldPrefix}.to`) === 'custom' && (
          <FormField
            control={form.control}
            name={`${fieldPrefix}.custom_email`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Email Address *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name={`${fieldPrefix}.subject`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject *</FormLabel>
              <FormControl>
                <Input placeholder="Email subject line" {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.body`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body *</FormLabel>
              <FormControl>
                <Textarea placeholder="Email body content..." rows={5} {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <VariableHint />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.reply_to`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reply-To (optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="reply@example.com" {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Create Task Action Config
  // =========================================================================
  if (actionType === 'create_task') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title *</FormLabel>
              <FormControl>
                <Input placeholder="Follow up with {{contact.name}}" {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Task description..." rows={3} {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <VariableHint />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`${fieldPrefix}.priority`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'medium'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`${fieldPrefix}.due_in_days`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due In (days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="3"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name={`${fieldPrefix}.project_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Leave empty for inbox" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>Assign to a specific project, or leave empty for inbox.</FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Add/Remove Tag Action Config
  // =========================================================================
  if (actionType === 'add_tag' || actionType === 'remove_tag') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.tags`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags *</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder={actionType === 'add_tag' ? 'Add tag to apply...' : 'Add tag to remove...'}
                />
              </FormControl>
              <FormDescription>
                {actionType === 'add_tag' ? 'These tags will be added to the contact.' : 'These tags will be removed from the contact.'}
              </FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Update Contact Action Config
  // =========================================================================
  if (actionType === 'update_contact') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.fields`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fields to Update *</FormLabel>
              <FormControl>
                <KeyValueInput
                  value={field.value || {}}
                  onChange={field.onChange}
                  keyPlaceholder="Field name (e.g., company)"
                  valuePlaceholder="New value"
                />
              </FormControl>
              <FormDescription>Set field names and their new values.</FormDescription>
            </FormItem>
          )}
        />
        <VariableHint />
      </div>
    );
  }

  // =========================================================================
  // Move Deal Action Config
  // =========================================================================
  if (actionType === 'move_deal') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.stage_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Stage ID *</FormLabel>
              <FormControl>
                <Input placeholder="Stage ID to move deal to" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>The deal will be moved to this stage in its pipeline.</FormDescription>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // Create Deal Action Config
  // =========================================================================
  if (actionType === 'create_deal') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Name *</FormLabel>
              <FormControl>
                <Input placeholder="Deal with {{contact.company}}" {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <VariableHint />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`${fieldPrefix}.pipeline_id`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pipeline ID *</FormLabel>
                <FormControl>
                  <Input placeholder="Pipeline ID" {...field} value={field.value || ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`${fieldPrefix}.stage_id`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage ID *</FormLabel>
                <FormControl>
                  <Input placeholder="Initial stage ID" {...field} value={field.value || ''} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name={`${fieldPrefix}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Value (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  value={field.value ?? ''}
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
  // Update Deal Action Config
  // =========================================================================
  if (actionType === 'update_deal') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.fields`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fields to Update *</FormLabel>
              <FormControl>
                <KeyValueInput
                  value={field.value || {}}
                  onChange={field.onChange}
                  keyPlaceholder="Field name (e.g., value)"
                  valuePlaceholder="New value"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <VariableHint />
      </div>
    );
  }

  // =========================================================================
  // Webhook Action Config
  // =========================================================================
  if (actionType === 'webhook') {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.url`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook URL *</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://api.example.com/webhook" {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.method`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>HTTP Method *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'POST'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.headers`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headers (optional)</FormLabel>
              <FormControl>
                <KeyValueInput value={field.value || {}} onChange={field.onChange} keyPlaceholder="Header name" valuePlaceholder="Header value" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.body_template`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Template (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='{"contact": "{{contact.email}}", "event": "{{trigger_type}}"}'
                  rows={4}
                  className="font-mono text-sm"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>JSON template for the request body.</FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.timeout_seconds`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeout (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30"
                  {...field}
                  value={field.value ?? ''}
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
  // Delay Action Config
  // =========================================================================
  if (actionType === 'delay') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Add a delay before the next action runs.</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`${fieldPrefix}.delay_days`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Days</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" min={0} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${fieldPrefix}.delay_hours`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" min={0} max={23} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${fieldPrefix}.delay_minutes`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minutes</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" min={0} max={59} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${fieldPrefix}.delay_seconds`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seconds</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" min={0} max={59} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // Condition Action Config
  // =========================================================================
  if (actionType === 'condition') {
    const currentOperator = form.watch(`${fieldPrefix}.operator`);
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Conditions create branches. Actions after this only run if the condition is met.</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name={`${fieldPrefix}.field`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field to Check *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., contact.email, deal.value" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>The field from trigger data to evaluate.</FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.operator`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operator *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'equals'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="not_contains">Does Not Contain</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="is_empty">Is Empty</SelectItem>
                  <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {currentOperator && !['is_empty', 'is_not_empty'].includes(currentOperator) && (
          <FormField
            control={form.control}
            name={`${fieldPrefix}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value *</FormLabel>
                <FormControl>
                  <Input placeholder="Value to compare against" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-4 rounded-lg bg-muted/50 text-center">
      <p className="text-sm text-muted-foreground">No configuration options available for this action type.</p>
    </div>
  );
}
