'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateInvoiceInput } from '@/types/invoices';
import type { Contact } from '@/types/contacts';
import type { Project } from '@/types/projects';

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill from query params
  const prefilledContactId = searchParams.get('contact_id');
  const prefilledProjectId = searchParams.get('project_id');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentWorkspace) return;

      setIsLoading(true);
      try {
        // Fetch contacts
        const contactsRes = await fetch(
          `/api/contacts?workspace_id=${currentWorkspace.id}&limit=100`
        );
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(data.contacts || []);
        }

        // Fetch projects
        const projectsRes = await fetch(
          `/api/projects?workspace_id=${currentWorkspace.id}`
        );
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentWorkspace]);

  const handleSubmit = async (data: CreateInvoiceInput) => {
    if (!currentWorkspace) return;

    setIsSubmitting(true);
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

      const result = await response.json();
      toast.success(`Invoice ${result.invoice.invoice_number} created`);
      router.push('/invoices');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/invoices');
  };

  // Loading state
  if (workspaceLoading || isLoading) {
    return (
      <div className="container py-6 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="container py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
        <p className="text-muted-foreground">
          Select or create a workspace to create invoices.
        </p>
      </div>
    );
  }

  // Find prefilled contact and project
  const prefilledContact = prefilledContactId
    ? contacts.find((c: Contact) => c.id === prefilledContactId)
    : undefined;
  const prefilledProject = prefilledProjectId
    ? projects.find((p: Project) => p.id === prefilledProjectId)
    : undefined;

  // Build default invoice based on prefills
  const defaultInvoice = prefilledContact
    ? {
        contact_id: prefilledContact.id,
        client_name: prefilledContact.name || '',
        client_email: prefilledContact.email,
        client_company: prefilledContact.company || undefined,
        client_phone: prefilledContact.phone || undefined,
        project_id: prefilledProjectId || undefined,
      }
    : prefilledProjectId
    ? { project_id: prefilledProjectId }
    : undefined;

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            New Invoice
          </h1>
          <p className="text-muted-foreground">
            Create a new invoice for your client
          </p>
        </div>
      </div>

      {/* Prefill Info */}
      {(prefilledContact || prefilledProject) && (
        <Card className="mb-6 bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 text-sm">
              {prefilledContact && (
                <div>
                  <span className="text-muted-foreground">Client: </span>
                  <span className="font-medium">
                    {prefilledContact.name || prefilledContact.email}
                  </span>
                </div>
              )}
              {prefilledProject && (
                <div>
                  <span className="text-muted-foreground">Project: </span>
                  <span className="font-medium">{prefilledProject.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <InvoiceForm
        invoice={defaultInvoice}
        contacts={contacts}
        projects={projects}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
