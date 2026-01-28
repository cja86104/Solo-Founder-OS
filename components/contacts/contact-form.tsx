'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Contact,
  getSourceLabel,
  getStatusLabel,
} from '@/types/contacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Mail,
  User,
  Phone,
  Building2,
  Briefcase,
  Tag,
  X,
  Plus,
} from 'lucide-react';

// ============================================================================
// Form Schema
// ============================================================================

const contactFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  status: z.enum(['active', 'unsubscribed', 'bounced', 'spam', 'archived']),
  tags: z.array(z.string()),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// ============================================================================
// Contact Form Props
// ============================================================================

interface ContactFormProps {
  contact?: Contact | null;
  existingTags?: string[];
  onSubmit: (data: ContactFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ============================================================================
// Contact Form Component
// ============================================================================

export function ContactForm({
  contact,
  existingTags = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ContactFormProps) {
  const [newTag, setNewTag] = useState('');

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      email: contact?.email || '',
      name: contact?.name || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      job_title: contact?.job_title || '',
      status: contact?.status || 'active',
      tags: contact?.tags || [],
    },
  });

  const currentTags = form.watch('tags');

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const availableTags = existingTags.filter((t) => !currentTags.includes(t));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email - Required */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  {...field}
                  disabled={!!contact} // Can't change email on existing contact
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Company */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Title */}
          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Title
                </FormLabel>
                <FormControl>
                  <Input placeholder="Product Manager" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(['active', 'unsubscribed', 'bounced', 'spam', 'archived'] as const).map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Tags */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </Label>

          {/* Current Tags */}
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

          {/* Add Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Existing Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Existing tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => form.setValue('tags', [...currentTags, tag])}
                  >
                    + {tag}
                  </Badge>
                ))}
                {availableTags.length > 10 && (
                  <span className="text-xs text-muted-foreground">
                    +{availableTags.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Source info (read-only) */}
        {contact && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Source: {getSourceLabel(contact.source)}</p>
              <p>
                Added: {new Date(contact.created_at).toLocaleDateString()}
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {contact ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ============================================================================
// Contact Form Dialog
// ============================================================================

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  existingTags?: string[];
  onSubmit: (data: ContactFormValues) => Promise<void>;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  existingTags = [],
  onSubmit,
}: ContactFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ContactFormValues) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
          <DialogDescription>
            {contact
              ? 'Update the contact information below.'
              : 'Enter the details for your new contact.'}
          </DialogDescription>
        </DialogHeader>

        <ContactForm
          contact={contact}
          existingTags={existingTags}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
