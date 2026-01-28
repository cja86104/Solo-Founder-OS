'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Invoice, InvoiceItem, CreateInvoiceInput, InvoiceItemType } from '@/types/invoices';
import type { Contact } from '@/types/contacts';
import type { Project } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronDown,
  GripVertical,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const invoiceItemSchema = z.object({
  type: z.enum(['service', 'product', 'expense', 'discount', 'tax']).default('service'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  unit: z.string().default('unit'),
  unit_price: z.number().min(0, 'Price cannot be negative'),
  is_taxable: z.boolean().default(true),
});

const invoiceFormSchema = z.object({
  contact_id: z.string().optional(),
  project_id: z.string().optional(),
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Valid email is required'),
  client_company: z.string().optional(),
  client_address: z.string().optional(),
  client_phone: z.string().optional(),
  client_tax_id: z.string().optional(),
  issue_date: z.date(),
  due_date: z.date(),
  currency: z.string().default('USD'),
  tax_rate: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  footer: z.string().optional(),
  accent_color: z.string().default('#6366f1'),
  reference: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice | null;
  existingItems?: InvoiceItem[];
  contacts?: Contact[];
  projects?: Project[];
  onSubmit: (data: CreateInvoiceInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function InvoiceForm({
  invoice,
  existingItems = [],
  contacts = [],
  projects = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InvoiceFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultItems = existingItems.length > 0
    ? existingItems.map(item => ({
        type: item.type as InvoiceItemType,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        is_taxable: item.is_taxable,
      }))
    : [{ type: 'service' as InvoiceItemType, description: '', quantity: 1, unit: 'unit', unit_price: 0, is_taxable: true }];

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      contact_id: invoice?.contact_id || '',
      project_id: invoice?.project_id || '',
      client_name: invoice?.client_name || '',
      client_email: invoice?.client_email || '',
      client_company: invoice?.client_company || '',
      client_address: invoice?.client_address || '',
      client_phone: invoice?.client_phone || '',
      client_tax_id: invoice?.client_tax_id || '',
      issue_date: invoice?.issue_date ? new Date(invoice.issue_date) : new Date(),
      due_date: invoice?.due_date ? new Date(invoice.due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: invoice?.currency || 'USD',
      tax_rate: invoice?.tax_rate || 0,
      discount_amount: invoice?.discount_amount || 0,
      notes: invoice?.notes || '',
      terms: invoice?.terms || '',
      footer: invoice?.footer || '',
      accent_color: invoice?.accent_color || '#6366f1',
      reference: invoice?.reference || '',
      items: defaultItems,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedTaxRate = form.watch('tax_rate');
  const watchedDiscount = form.watch('discount_amount');
  const watchedContactId = form.watch('contact_id');

  // Auto-fill client info when contact is selected
  useEffect(() => {
    if (watchedContactId) {
      const contact = contacts.find(c => c.id === watchedContactId);
      if (contact) {
        form.setValue('client_name', contact.name || '');
        form.setValue('client_email', contact.email);
        form.setValue('client_company', contact.company || '');
        form.setValue('client_phone', contact.phone || '');
      }
    }
  }, [watchedContactId, contacts, form]);

  // Calculate totals
  type WatchedItem = { quantity?: number; unit_price?: number; is_taxable?: boolean };
  const subtotal = watchedItems.reduce((sum: number, item: WatchedItem) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);

  const taxableAmount = watchedItems
    .filter((item: WatchedItem) => item.is_taxable)
    .reduce((sum: number, item: WatchedItem) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);

  const taxAmount = taxableAmount * (watchedTaxRate / 100);
  const total = subtotal + taxAmount - (watchedDiscount || 0);

  const formatCurrency = (amount: number) => {
    const currency = form.watch('currency') || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleSubmit = async (data: InvoiceFormValues) => {
    const submitData: CreateInvoiceInput = {
      contact_id: data.contact_id || undefined,
      project_id: data.project_id || undefined,
      client_name: data.client_name,
      client_email: data.client_email,
      client_company: data.client_company || undefined,
      client_address: data.client_address || undefined,
      client_phone: data.client_phone || undefined,
      client_tax_id: data.client_tax_id || undefined,
      issue_date: data.issue_date.toISOString().split('T')[0],
      due_date: data.due_date.toISOString().split('T')[0],
      currency: data.currency,
      tax_rate: data.tax_rate,
      discount_amount: data.discount_amount,
      notes: data.notes || undefined,
      terms: data.terms || undefined,
      footer: data.footer || undefined,
      accent_color: data.accent_color,
      reference: data.reference || undefined,
      items: data.items.map((item, index) => ({
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        is_taxable: item.is_taxable,
        position: index,
      })),
    };
    await onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts.length > 0 && (
              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select from Contacts</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a contact or enter manually" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Enter manually</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name || contact.email}
                            {contact.company && ` - ${contact.company}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Client name" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="client@example.com" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Company name" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="+1 (555) 000-0000" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="client_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea placeholder="Street address, city, state, zip" className="pl-10 min-h-[80px]" {...field} />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
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

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
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
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {projects.length > 0 && (
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference / PO Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional reference number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg"
              >
                <div className="col-span-12 md:col-span-5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input
                    {...form.register(`items.${index}.description`)}
                    placeholder="Item description"
                  />
                  {form.formState.errors.items?.[index]?.description && (
                    <p className="text-xs text-destructive mt-1">
                      {form.formState.errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <div className="h-10 flex items-center font-medium">
                    {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0))}
                  </div>
                </div>
                <div className="col-span-1 flex items-end pb-2">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ type: 'service', description: '', quantity: 1, unit: 'unit', unit_price: 0, is_taxable: true })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            {form.formState.errors.items?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Tax Rate (%)</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-24 text-right"
                    {...form.register('tax_rate', { valueAsNumber: true })}
                  />
                </div>
                {watchedTaxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax Amount</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Discount</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-24 text-right"
                    {...form.register('discount_amount', { valueAsNumber: true })}
                  />
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" type="button" className="w-full justify-between">
              Advanced Options
              <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes for the client..." rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Payment terms, late fees, etc..." rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="footer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Input placeholder="Thank you for your business!" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accent_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="w-12 h-10 p-1 cursor-pointer" {...field} />
                      <Input placeholder="#6366f1" {...field} className="flex-1" />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {invoice ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  existingItems?: InvoiceItem[];
  contacts?: Contact[];
  projects?: Project[];
  onSubmit: (data: CreateInvoiceInput) => Promise<void>;
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  existingItems = [],
  contacts = [],
  projects = [],
  onSubmit,
}: InvoiceFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateInvoiceInput) => {
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogDescription>
            {invoice
              ? 'Update the invoice details below.'
              : 'Fill in the details to create a new invoice.'}
          </DialogDescription>
        </DialogHeader>

        <InvoiceForm
          invoice={invoice}
          existingItems={existingItems}
          contacts={contacts}
          projects={projects}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
