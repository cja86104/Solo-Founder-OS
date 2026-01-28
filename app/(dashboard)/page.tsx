'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { InvoiceList } from '@/components/invoices/invoice-list';
import { InvoiceFormDialog } from '@/components/invoices/invoice-form';
import { InvoicePreview } from '@/components/invoices/invoice-preview';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type {
  InvoiceWithRelations,
  InvoiceItem,
  CreateInvoiceInput,
} from '@/types/invoices';
import type { Contact } from '@/types/contacts';
import type { Project } from '@/types/projects';

export default function InvoicesPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<{
    total_count: number;
    total_amount: number;
    total_paid: number;
    draft_count: number;
    sent_count: number;
    paid_count: number;
    overdue_count: number;
  } | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Selected invoice for preview
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<InvoiceItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [editingItems, setEditingItems] = useState<InvoiceItem[]>([]);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceWithRelations | null>(null);

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState<InvoiceWithRelations | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      // Fetch invoices
      const invoicesRes = await fetch(
        `/api/invoices?workspace_id=${currentWorkspace.id}`
      );
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
        setSummary(data.summary);
      }

      // Fetch contacts for form
      const contactsRes = await fetch(
        `/api/contacts?workspace_id=${currentWorkspace.id}&limit=100`
      );
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }

      // Fetch projects for form
      const projectsRes = await fetch(
        `/api/projects?workspace_id=${currentWorkspace.id}`
      );
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleView = async (invoice: InvoiceWithRelations) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data.invoice);
        setSelectedInvoiceItems(data.invoice.items || []);
        setPreviewOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load invoice');
    }
  };

  const handleEdit = async (invoice: InvoiceWithRelations) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditingInvoice(data.invoice);
        setEditingItems(data.invoice.items || []);
        setFormOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load invoice');
    }
  };

  const handleCreateInvoice = async (data: CreateInvoiceInput) => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      toast.success('Invoice created');
      setFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
      throw error;
    }
  };

  const handleUpdateInvoice = async (data: CreateInvoiceInput) => {
    if (!editingInvoice) return;

    try {
      const response = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update invoice');
      }

      toast.success('Invoice updated');
      setEditingInvoice(null);
      setEditingItems([]);
      setFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice');
      throw error;
    }
  };

  const handleSend = async (invoice: InvoiceWithRelations) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });

      if (!response.ok) throw new Error('Failed to send invoice');

      toast.success('Invoice marked as sent');
      fetchData();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleDuplicate = async (invoice: InvoiceWithRelations) => {
    try {
      // Fetch full invoice with items
      const res = await fetch(`/api/invoices/${invoice.id}`);
      if (!res.ok) throw new Error('Failed to load invoice');

      const data = await res.json();
      const sourceInvoice = data.invoice;

      // Set up form with duplicated data
      setEditingInvoice(null);
      setEditingItems(sourceInvoice.items || []);

      // Create the duplicate
      await handleCreateInvoice({
        contact_id: sourceInvoice.contact_id,
        client_name: sourceInvoice.client_name,
        client_email: sourceInvoice.client_email,
        client_company: sourceInvoice.client_company,
        client_address: sourceInvoice.client_address,
        client_phone: sourceInvoice.client_phone,
        project_id: sourceInvoice.project_id,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: sourceInvoice.currency,
        tax_rate: sourceInvoice.tax_rate,
        discount_amount: sourceInvoice.discount_amount,
        notes: sourceInvoice.notes,
        terms: sourceInvoice.terms,
        footer: sourceInvoice.footer,
        accent_color: sourceInvoice.accent_color,
        items: sourceInvoice.items?.map((item: InvoiceItem) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          is_taxable: item.is_taxable,
        })),
      });

      toast.success('Invoice duplicated');
    } catch (error) {
      toast.error('Failed to duplicate invoice');
    }
  };

  const handleDownload = (invoice: InvoiceWithRelations) => {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }

      toast.success('Invoice deleted');
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete invoice');
    }
  };

  const handleRecordPayment = (invoice: InvoiceWithRelations) => {
    setInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  };

  const handleViewPublic = (invoice: InvoiceWithRelations) => {
    window.open(`/invoice/${invoice.id}?token=${invoice.public_token}`, '_blank');
  };

  // Loading state
  if (workspaceLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="container py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
        <p className="text-muted-foreground">
          Select or create a workspace to manage invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Invoices
          </h1>
          <p className="text-muted-foreground">
            Create and manage invoices for your clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {can('projects', 'create') && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Invoice List */}
      <InvoiceList
        invoices={invoices}
        summary={summary}
        isLoading={isLoading}
        onView={handleView}
        onEdit={can('projects', 'update') ? handleEdit : undefined}
        onSend={can('projects', 'update') ? handleSend : undefined}
        onDuplicate={can('projects', 'create') ? handleDuplicate : undefined}
        onDownload={handleDownload}
        onDelete={
          can('projects', 'delete')
            ? (invoice) => {
                setInvoiceToDelete(invoice);
                setDeleteDialogOpen(true);
              }
            : undefined
        }
        onCreateNew={can('projects', 'create') ? () => setFormOpen(true) : undefined}
      />

      {/* Invoice Form Dialog */}
      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingInvoice(null);
            setEditingItems([]);
          }
        }}
        invoice={editingInvoice}
        existingItems={editingItems}
        contacts={contacts}
        projects={projects}
        onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
      />

      {/* Invoice Preview Sheet */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice Details</SheetTitle>
            <SheetDescription>
              {selectedInvoice?.invoice_number}
            </SheetDescription>
          </SheetHeader>
          {selectedInvoice && (
            <div className="mt-6">
              <InvoicePreview
                invoice={selectedInvoice}
                items={selectedInvoiceItems}
                onEdit={
                  selectedInvoice.status === 'draft' && can('projects', 'update')
                    ? () => {
                        setPreviewOpen(false);
                        handleEdit(selectedInvoice);
                      }
                    : undefined
                }
                onSend={
                  selectedInvoice.status === 'draft' && can('projects', 'update')
                    ? () => {
                        setPreviewOpen(false);
                        handleSend(selectedInvoice);
                      }
                    : undefined
                }
                onDownload={() => handleDownload(selectedInvoice)}
                onDuplicate={
                  can('projects', 'create')
                    ? () => {
                        setPreviewOpen(false);
                        handleDuplicate(selectedInvoice);
                      }
                    : undefined
                }
                onRecordPayment={
                  !['paid', 'cancelled', 'refunded'].includes(selectedInvoice.status) &&
                  can('projects', 'update')
                    ? () => handleRecordPayment(selectedInvoice)
                    : undefined
                }
                onViewPublic={() => handleViewPublic(selectedInvoice)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice &quot;{invoiceToDelete?.invoice_number}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
