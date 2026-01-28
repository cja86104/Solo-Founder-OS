'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FeedbackWidget,
  CreateWidgetInput,
  generateWidgetSlug,
  getWidgetEmbedCode,
} from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Copy, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const widgetFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  theme: z.enum(['light', 'dark', 'auto']),
  primary_color: z.string(),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
  title: z.string(),
  description: z.string(),
  placeholder: z.string(),
  success_message: z.string(),
  allow_attachments: z.boolean(),
  require_email: z.boolean(),
  show_emoji_rating: z.boolean(),
  categories: z.array(z.string()),
});

type WidgetFormValues = z.infer<typeof widgetFormSchema>;

interface WidgetFormProps {
  widget?: FeedbackWidget | null;
  onSubmit: (data: CreateWidgetInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WidgetForm({
  widget,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WidgetFormProps) {
  const [newCategory, setNewCategory] = useState('');
  const [copied, setCopied] = useState(false);

  const form = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetFormSchema),
    defaultValues: {
      name: widget?.name || '',
      slug: widget?.slug || '',
      theme: widget?.theme || 'auto',
      primary_color: widget?.primary_color || '#6366f1',
      position: widget?.position || 'bottom-right',
      title: widget?.title || 'Send us feedback',
      description: widget?.description || "We'd love to hear from you",
      placeholder: widget?.placeholder || "What's on your mind?",
      success_message: widget?.success_message || 'Thank you for your feedback!',
      allow_attachments: widget?.allow_attachments || false,
      require_email: widget?.require_email || false,
      show_emoji_rating: widget?.show_emoji_rating ?? true,
      categories: widget?.categories || ['bug', 'feature', 'question', 'other'],
    },
  });

  const name = form.watch('name');
  const categories = form.watch('categories');

  const handleGenerateSlug = () => {
    if (name) {
      form.setValue('slug', generateWidgetSlug(name));
    }
  };

  const handleAddCategory = () => {
    const cat = newCategory.trim().toLowerCase();
    if (cat && !categories.includes(cat)) {
      form.setValue('categories', [...categories, cat]);
    }
    setNewCategory('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    form.setValue(
      'categories',
      categories.filter((c) => c !== catToRemove)
    );
  };

  const copyEmbedCode = async () => {
    if (!widget) return;
    const code = getWidgetEmbedCode(widget.id, window.location.origin);
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Embed code copied!');
  };

  const handleSubmit = async (data: WidgetFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Feedback Widget" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="my-widget" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleGenerateSlug}>
                      Generate
                    </Button>
                  </div>
                  <FormDescription>
                    Used in the widget URL and embed code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placeholder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Input Placeholder</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="success_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Message</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input type="color" className="w-12 h-10 p-1" {...field} />
                    </FormControl>
                    <Input value={field.value} onChange={field.onChange} className="flex-1" />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Position</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="show_emoji_rating"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Emoji Rating</FormLabel>
                    <FormDescription>
                      Allow users to rate with emojis
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="require_email"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Require Email</FormLabel>
                    <FormDescription>
                      Email is mandatory to submit
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allow_attachments"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Allow Attachments</FormLabel>
                    <FormDescription>
                      Users can upload screenshots
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-3">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1">
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Embed Code (only for existing widgets) */}
        {widget && (
          <div className="space-y-2 p-4 rounded-lg bg-muted">
            <Label>Embed Code</Label>
            <div className="flex gap-2">
              <code className="flex-1 p-2 text-xs bg-background rounded border overflow-auto">
                {getWidgetEmbedCode(widget.id, window.location.origin)}
              </code>
              <Button type="button" variant="outline" size="icon" onClick={copyEmbedCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {widget ? 'Save Changes' : 'Create Widget'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface WidgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget?: FeedbackWidget | null;
  onSubmit: (data: CreateWidgetInput) => Promise<void>;
}

export function WidgetFormDialog({
  open,
  onOpenChange,
  widget,
  onSubmit,
}: WidgetFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateWidgetInput) => {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{widget ? 'Edit Widget' : 'Create Feedback Widget'}</DialogTitle>
          <DialogDescription>
            Configure your embeddable feedback widget.
          </DialogDescription>
        </DialogHeader>

        <WidgetForm
          widget={widget}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
