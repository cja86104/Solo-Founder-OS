'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { FeedbackCard } from '@/components/feedback/feedback-card';
import { WidgetFormDialog } from '@/components/feedback/widget-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  Plus,
  Search,
  RefreshCw,
  Settings,
  Inbox,
  CheckCircle,
  Clock,
  BarChart3,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FeedbackWidget,
  FeedbackSubmissionWithRelations,
  FeedbackStatus,
  CreateWidgetInput,
  getStatusLabel,
  getWidgetEmbedCode,
} from '@/types/feedback';

export default function FeedbackPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [widgets, setWidgets] = useState<FeedbackWidget[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackSubmissionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('all');

  // Form state
  const [widgetFormOpen, setWidgetFormOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<FeedbackWidget | null>(null);

  // Detail view state
  const [selectedSubmission, setSelectedSubmission] =
    useState<FeedbackSubmissionWithRelations | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] =
    useState<FeedbackSubmissionWithRelations | null>(null);

  // Embed code copy
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      // Fetch widgets
      const widgetsRes = await fetch(
        `/api/feedback/widgets?workspace_id=${currentWorkspace.id}`
      );
      if (widgetsRes.ok) {
        const data = await widgetsRes.json();
        setWidgets(data.widgets || []);
      }

      // Fetch submissions
      const params = new URLSearchParams({
        workspace_id: currentWorkspace.id,
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (selectedWidgetId !== 'all') params.set('widget_id', selectedWidgetId);
      if (search) params.set('search', search);

      const submissionsRes = await fetch(`/api/feedback/submissions?${params}`);
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
      }
    } catch {
      toast.error('Failed to load feedback data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, statusFilter, selectedWidgetId, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === 'new').length,
    in_review: submissions.filter((s) => s.status === 'in_review').length,
    resolved: submissions.filter((s) => s.status === 'resolved').length,
  };

  // Handlers
  const handleCreateWidget = async (data: CreateWidgetInput) => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch('/api/feedback/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create widget');
      }

      toast.success('Widget created successfully');
      setWidgetFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create widget');
      throw error;
    }
  };

  const handleStatusChange = async (
    submission: FeedbackSubmissionWithRelations,
    status: FeedbackStatus
  ) => {
    try {
      const response = await fetch('/api/feedback/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submission.id,
          status,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Marked as ${getStatusLabel(status)}`);
      fetchData();
      if (selectedSubmission?.id === submission.id) {
        setSelectedSubmission({ ...selectedSubmission, status });
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    try {
      const response = await fetch(
        `/api/feedback/submissions/${submissionToDelete.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Feedback deleted');
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
      if (selectedSubmission?.id === submissionToDelete.id) {
        setSelectedSubmission(null);
      }
      fetchData();
    } catch {
      toast.error('Failed to delete feedback');
    }
  };

  const copyEmbedCode = async (widget: FeedbackWidget) => {
    const code = getWidgetEmbedCode(widget.id, window.location.origin);
    await navigator.clipboard.writeText(code);
    setCopiedWidgetId(widget.id);
    setTimeout(() => setCopiedWidgetId(null), 2000);
    toast.success('Embed code copied!');
  };

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
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
            <p className="text-muted-foreground">
              Please select a workspace to manage feedback.
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
            <MessageSquare className="h-8 w-8" />
            Feedback
          </h1>
          <p className="text-muted-foreground">
            Collect and manage user feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {can('feedback.manage') && (
            <Button onClick={() => setWidgetFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Widget
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold">{stats.new}</p>
              </div>
              <Inbox className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Review</p>
                <p className="text-2xl font-bold">{stats.in_review}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {stats.new > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.new}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="widgets" className="gap-2">
            <Settings className="h-4 w-4" />
            Widgets
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
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
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {widgets.length > 0 && (
              <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Widget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Widgets</SelectItem>
                  {widgets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Submissions List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No feedback yet</h3>
                <p className="text-muted-foreground">
                  Create a widget and embed it on your site to start collecting feedback.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <FeedbackCard
                  key={submission.id}
                  submission={submission}
                  onClick={() => setSelectedSubmission(submission)}
                  onStatusChange={(status) =>
                    handleStatusChange(submission, status as FeedbackStatus)
                  }
                  onDelete={() => {
                    setSubmissionToDelete(submission);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="mt-6">
          {widgets.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No widgets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first feedback widget to embed on your site.
                </p>
                <Button onClick={() => setWidgetFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Widget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {widgets.map((widget) => (
                <Card key={widget.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{widget.name}</CardTitle>
                      <Badge variant={widget.is_active ? 'default' : 'secondary'}>
                        {widget.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>/{widget.slug}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingWidget(widget);
                          setWidgetFormOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyEmbedCode(widget)}
                      >
                        {copiedWidgetId === widget.id ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy Embed
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Widget Form Dialog */}
      <WidgetFormDialog
        open={widgetFormOpen}
        onOpenChange={(open) => {
          setWidgetFormOpen(open);
          if (!open) setEditingWidget(null);
        }}
        widget={editingWidget}
        onSubmit={handleCreateWidget}
      />

      {/* Submission Detail Sheet */}
      <Sheet
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Feedback Details</SheetTitle>
            <SheetDescription>
              View and respond to this feedback
            </SheetDescription>
          </SheetHeader>
          {selectedSubmission && (
            <div className="mt-6">
              <FeedbackCard
                submission={selectedSubmission}
                variant="detailed"
                onStatusChange={(status) =>
                  handleStatusChange(selectedSubmission, status as FeedbackStatus)
                }
              />

            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmission}
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
