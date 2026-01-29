'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Deal, PipelineStage, CreateDealInput } from '@/types/crm';
import { Contact } from '@/types/contacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Loader2,
  DollarSign,
  Calendar as CalendarIcon,
  Building2,
  X,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const dealFormSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  value: z.number().min(0, 'Value must be positive'),
  currency: z.string().default('USD'),
  stage_id: z.string().optional(),
  probability: z.number().min(0).max(100),
  contact_id: z.string().optional(),
  company: z.string().optional(),
  expected_close_date: z.date().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

interface DealFormProps {
  deal?: Deal | null;
  stages: PipelineStage[];
  contacts?: Contact[];
  initialStageId?: string;
  onSubmit: (data: CreateDealInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function DealForm({
  deal,
  stages,
  contacts = [],
  initialStageId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DealFormProps) {
  const [newTag, setNewTag] = useState('');

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: deal?.name || '',
      value: deal?.value || 0,
      currency: deal?.currency || 'USD',
      stage_id: deal?.stage_id || initialStageId || stages[0]?.id || '',
      probability: deal?.probability || 50,
      contact_id: deal?.contact_id || '',
      company: deal?.company || '',
      expected_close_date: deal?.expected_close_date
        ? new Date(deal.expected_close_date)
        : undefined,
      description: deal?.description || '',
      tags: deal?.tags || [],
    },
  });

  const currentTags = form.watch('tags');
  const probability = form.watch('probability');

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      'tags',
      currentTags.filter((t) => t !== tagToRemove)
    );
  };

  const handleSubmit = async (data: DealFormValues) => {
    await onSubmit({
      name: data.name,
      value: data.value,
      currency: data.currency,
      stage_id: data.stage_id,
      probability: data.probability,
      contact_id: data.contact_id || undefined,
      company: data.company || undefined,
      expected_close_date: data.expected_close_date?.toISOString(),
      description: data.description || undefined,
      tags: data.tags,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Enterprise Contract" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Value and Currency */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Deal Value</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Stage */}
        <FormField
          control={form.control}
          name="stage_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stages
                    .filter((s) => !s.is_won && !s.is_lost)
                    .map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Probability */}
        <FormField
          control={form.control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Win Probability</FormLabel>
                <span className="text-sm font-medium">{probability}%</span>
              </div>
              <FormControl>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[field.value]}
                  onValueChange={(v) => field.onChange(v[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Company */}
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Company name" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact */}
        {contacts.length > 0 && (
          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name || contact.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Expected Close Date */}
        <FormField
          control={form.control}
          name="expected_close_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Close Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about this deal..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <div className="space-y-3">
          <Label>Tags</Label>
          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {deal ? 'Save Changes' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  stages: PipelineStage[];
  contacts?: Contact[];
  initialStageId?: string;
  onSubmit: (data: CreateDealInput) => Promise<void>;
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  stages,
  contacts = [],
  initialStageId,
  onSubmit,
}: DealFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateDealInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
          <DialogDescription>
            {deal
              ? 'Update the deal information below.'
              : 'Enter the details for your new deal.'}
          </DialogDescription>
        </DialogHeader>

        <DealForm
          deal={deal}
          stages={stages}
          contacts={contacts}
          initialStageId={initialStageId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
