'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { ContactCard } from '@/components/contacts/contact-card';
import { ContactFormDialog } from '@/components/contacts/contact-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';

import {
  Users,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  UserCheck,
  UserX,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Contact,
  ContactStats,
} from '@/types/contacts';

export default function ContactsPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        workspace_id: currentWorkspace.id,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);

      const response = await fetch(`/api/contacts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');

      const data = await response.json();
      setContacts(data.contacts || []);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, pagination.page, pagination.pageSize, search, statusFilter, sourceFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch(
        `/api/contacts/stats?workspace_id=${currentWorkspace.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handlers
  const handleCreateContact = async (data: Partial<Contact>) => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contact');
      }

      toast.success('Contact created successfully');
      setFormOpen(false);
      fetchContacts();
      fetchStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create contact');
      throw error;
    }
  };

  const handleUpdateContact = async (data: Partial<Contact>) => {
    if (!editingContact) return;

    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update contact');
      }

      toast.success('Contact updated successfully');
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update contact');
      throw error;
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      const response = await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete contact');

      toast.success('Contact deleted successfully');
      setDeleteDialogOpen(false);
      setContactToDelete(null);
      fetchContacts();
      fetchStats();
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0 || !currentWorkspace) return;

    try {
      const response = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          contact_ids: Array.from(selectedContacts),
          action: 'delete',
        }),
      });

      if (!response.ok) throw new Error('Failed to delete contacts');

      toast.success(`Deleted ${selectedContacts.size} contacts`);
      setSelectedContacts(new Set());
      fetchContacts();
      fetchStats();
    } catch {
      toast.error('Failed to delete contacts');
    }
  };

  const toggleSelectContact = (contact: Contact) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contact.id)) {
      newSelected.delete(contact.id);
    } else {
      newSelected.add(contact.id);
    }
    setSelectedContacts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((c) => c.id)));
    }
  };

  // Get existing tags for form
  const existingTags = [...new Set(contacts.flatMap((c) => c.tags))];

  if (workspaceLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
            <p className="text-muted-foreground">
              Please select or create a workspace to manage contacts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Contacts
          </h1>
          <p className="text-muted-foreground">
            Manage your contacts across all products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchContacts}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {can('contacts.create') && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New This Week</p>
                  <p className="text-2xl font-bold">{stats.recentlyAdded}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unsubscribed</p>
                  <p className="text-2xl font-bold">{stats.unsubscribed}</p>
                </div>
                <UserX className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="landing_page">Landing Page</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedContacts.size > 0 && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedContacts(new Set())}>
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Contacts</CardTitle>
            <div className="flex items-center gap-2">
              {contacts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedContacts.size === contacts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all' || sourceFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first contact to get started'}
              </p>
              {can('contacts.create') && !search && statusFilter === 'all' && (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  selected={selectedContacts.has(contact.id)}
                  onSelect={toggleSelectContact}
                  onClick={(c) => setEditingContact(c)}
                  onEdit={(c) => setEditingContact(c)}
                  onDelete={(c) => {
                    setContactToDelete(c);
                    setDeleteDialogOpen(true);
                  }}
                  showActions={can('contacts.update')}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total} contacts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <ContactFormDialog
        open={formOpen || !!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingContact(null);
          }
        }}
        contact={editingContact}
        existingTags={existingTags}
        onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{contactToDelete?.name || contactToDelete?.email}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
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
