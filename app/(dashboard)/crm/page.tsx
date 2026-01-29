'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { PipelineBoard } from '@/components/crm/pipeline-board';
import { DealCard } from '@/components/crm/deal-card';
import { DealFormDialog } from '@/components/crm/deal-form';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Handshake,
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Target,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DealWithRelations,
  PipelineStage,
  CRMStats,
  CreateDealInput,
  formatCurrency,
  calculateWinRate,
} from '@/types/crm';
import { Contact } from '@/types/contacts';

export default function CRMPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealWithRelations | null>(null);
  const [initialStageId, setInitialStageId] = useState<string | undefined>();

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<DealWithRelations | null>(null);

  // Lost reason state
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [dealToLose, setDealToLose] = useState<DealWithRelations | null>(null);
  const [lostReason, setLostReason] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      // Fetch stages
      const stagesRes = await fetch(
        `/api/crm/stages?workspace_id=${currentWorkspace.id}`
      );
      if (stagesRes.ok) {
        const data = await stagesRes.json();
        setStages(data.stages || []);
      }

      // Fetch deals
      const dealsRes = await fetch(
        `/api/crm/deals?workspace_id=${currentWorkspace.id}`
      );
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDeals(data.deals || []);
      }

      // Fetch contacts for form
      const contactsRes = await fetch(
        `/api/contacts?workspace_id=${currentWorkspace.id}&pageSize=100`
      );
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      toast.error('Failed to load CRM data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const stats: CRMStats = {
    total_deals: deals.length,
    open_deals: deals.filter((d) => d.status === 'open').length,
    won_deals: deals.filter((d) => d.status === 'won').length,
    lost_deals: deals.filter((d) => d.status === 'lost').length,
    pipeline_value: deals
      .filter((d) => d.status === 'open')
      .reduce((sum, d) => sum + d.value, 0),
    won_value: deals
      .filter((d) => d.status === 'won')
      .reduce((sum, d) => sum + d.value, 0),
    avg_deal_size:
      deals.length > 0
        ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length
        : 0,
    won_last_30_days: 0,
    revenue_last_30_days: 0,
    win_rate: calculateWinRate(
      deals.filter((d) => d.status === 'won').length,
      deals.filter((d) => d.status === 'lost').length
    ),
  };

  // Handlers
  const handleCreateDeal = async (data: CreateDealInput) => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...data,
        }),
      });

      if (!response.ok) throw new Error('Failed to create deal');

      toast.success('Deal created successfully');
      setFormOpen(false);
      setInitialStageId(undefined);
      fetchData();
    } catch (error) {
      toast.error('Failed to create deal');
      throw error;
    }
  };

  const handleUpdateDeal = async (data: CreateDealInput) => {
    if (!editingDeal) return;

    try {
      const response = await fetch(`/api/crm/deals/${editingDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update deal');

      toast.success('Deal updated successfully');
      setEditingDeal(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update deal');
      throw error;
    }
  };

  const handleMoveDeal = async (
    dealId: string,
    newStageId: string,
    newPosition: number
  ) => {
    try {
      const response = await fetch('/api/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: dealId,
          stage_id: newStageId,
          position: newPosition,
        }),
      });

      if (!response.ok) throw new Error('Failed to move deal');

      // Optimistic update
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId
            ? { ...d, stage_id: newStageId, position: newPosition }
            : d
        )
      );
    } catch (error) {
      toast.error('Failed to move deal');
      fetchData();
    }
  };

  const handleMarkWon = async (deal: DealWithRelations) => {
    try {
      const response = await fetch('/api/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: deal.id,
          status: 'won',
        }),
      });

      if (!response.ok) throw new Error('Failed to update deal');

      toast.success('Deal marked as won! 🎉');
      fetchData();
    } catch (error) {
      toast.error('Failed to update deal');
    }
  };

  const handleMarkLost = async () => {
    if (!dealToLose) return;

    try {
      const response = await fetch('/api/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: dealToLose.id,
          status: 'lost',
          lost_reason: lostReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to update deal');

      toast.success('Deal marked as lost');
      setLostDialogOpen(false);
      setDealToLose(null);
      setLostReason('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update deal');
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;

    try {
      const response = await fetch(`/api/crm/deals/${dealToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete deal');

      toast.success('Deal deleted');
      setDeleteDialogOpen(false);
      setDealToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  const handleAddDeal = (stageId: string) => {
    setInitialStageId(stageId);
    setFormOpen(true);
  };

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !deal.name.toLowerCase().includes(searchLower) &&
        !deal.company?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (statusFilter !== 'all' && deal.status !== statusFilter) {
      return false;
    }
    return true;
  });

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
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
            <p className="text-muted-foreground">
              Please select a workspace to manage deals.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Handshake className="h-8 w-8" />
              CRM
            </h1>
            <p className="text-muted-foreground">
              Manage your deals and pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {can('deals.create') && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
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
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.pipeline_value)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Deals</p>
                  <p className="text-2xl font-bold">{stats.open_deals}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Won Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.won_value)}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{stats.win_rate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
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
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={view === 'board' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('board')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="container">
            <Skeleton className="h-[500px]" />
          </div>
        ) : view === 'board' ? (
          <PipelineBoard
            stages={stages}
            deals={filteredDeals}
            onDealClick={(deal) => setEditingDeal(deal)}
            onDealEdit={(deal) => setEditingDeal(deal)}
            onDealDelete={(deal) => {
              setDealToDelete(deal);
              setDeleteDialogOpen(true);
            }}
            onDealMove={handleMoveDeal}
            onDealMarkWon={handleMarkWon}
            onDealMarkLost={(deal) => {
              setDealToLose(deal);
              setLostDialogOpen(true);
            }}
            onAddDeal={handleAddDeal}
          />
        ) : (
          <div className="container space-y-2 pb-8">
            {filteredDeals.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No deals found</p>
                </CardContent>
              </Card>
            ) : (
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  variant="list"
                  onClick={(d) => setEditingDeal(d)}
                  onEdit={(d) => setEditingDeal(d)}
                  onDelete={(d) => {
                    setDealToDelete(d);
                    setDeleteDialogOpen(true);
                  }}
                  onMarkWon={handleMarkWon}
                  onMarkLost={(d) => {
                    setDealToLose(d);
                    setLostDialogOpen(true);
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <DealFormDialog
        open={formOpen || !!editingDeal}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingDeal(null);
            setInitialStageId(undefined);
          }
        }}
        deal={editingDeal}
        stages={stages}
        contacts={contacts}
        initialStageId={initialStageId}
        onSubmit={editingDeal ? handleUpdateDeal : handleCreateDeal}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{dealToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lost Reason Dialog */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Lost</DialogTitle>
            <DialogDescription>
              Why was this deal lost? This helps improve your sales process.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="lostReason">Reason (optional)</Label>
            <Textarea
              id="lostReason"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="e.g., Budget constraints, Went with competitor, etc."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMarkLost}>
              Mark as Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
