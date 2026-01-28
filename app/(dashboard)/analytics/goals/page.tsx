'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import type { Goal, GoalPerformance } from '@/types/analytics';
import { formatNumber, formatPercentage } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MousePointerClick,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface GoalFormData {
  name: string;
  description: string;
  goal_type: 'page_view' | 'event' | 'duration' | 'pages_per_session';
  target_value: string;
  target_operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  conversion_value: number;
}

const defaultFormData: GoalFormData = {
  name: '',
  description: '',
  goal_type: 'page_view',
  target_value: '',
  target_operator: 'equals',
  conversion_value: 0,
};

// =============================================================================
// Helper Functions
// =============================================================================

function getGoalTypeIcon(type: string) {
  switch (type) {
    case 'page_view':
      return Eye;
    case 'event':
      return MousePointerClick;
    case 'duration':
      return Clock;
    case 'pages_per_session':
      return FileText;
    default:
      return Target;
  }
}

function getGoalTypeLabel(type: string): string {
  switch (type) {
    case 'page_view':
      return 'Page View';
    case 'event':
      return 'Event';
    case 'duration':
      return 'Duration';
    case 'pages_per_session':
      return 'Pages/Session';
    default:
      return type;
  }
}

// =============================================================================
// Page Component
// =============================================================================

export default function AnalyticsGoalsPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [performance, setPerformance] = useState<GoalPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/goals?workspace_id=${currentWorkspace.id}&include=performance&period=30d`
      );

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
        setPerformance(data.performance || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Handle form submit
  const handleSubmit = async () => {
    if (!currentWorkspace || !formData.name || !formData.target_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/analytics/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create goal');
      }

      toast.success('Goal created successfully');
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      goal_type: goal.goal_type as GoalFormData['goal_type'],
      target_value: goal.target_value,
      target_operator: goal.target_operator as GoalFormData['target_operator'],
      conversion_value: goal.conversion_value,
    });
    setIsDialogOpen(true);
  };

  // Reset form
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData(defaultFormData);
  };

  // Get performance for a goal
  const getGoalPerformance = (goalId: string): GoalPerformance | undefined => {
    return performance.find((p) => p.goal.id === goalId);
  };

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Permission check
  if (!can('content.view')) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view goals.
          </p>
        </CardContent>
      </Card>
    );
  }

  const canEdit = can('content.update');

  // Summary stats
  const totalCompletions = performance.reduce((sum, p) => sum + p.completions, 0);
  const avgConversionRate =
    performance.length > 0
      ? performance.reduce((sum, p) => sum + p.conversion_rate, 0) / performance.length
      : 0;
  const totalValue = performance.reduce((sum, p) => sum + p.total_value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/analytics')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6" />
              Conversion Goals
            </h1>
            <p className="text-muted-foreground">
              Track important user actions and conversions
            </p>
          </div>
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData(defaultFormData)}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Edit Goal' : 'Create Goal'}
                </DialogTitle>
                <DialogDescription>
                  Define what counts as a conversion
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Sign Up, Purchase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this goal tracks"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal_type">Goal Type *</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        goal_type: v as GoalFormData['goal_type'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page_view">Page View</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="duration">Session Duration</SelectItem>
                      <SelectItem value="pages_per_session">Pages per Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_operator">Condition</Label>
                    <Select
                      value={formData.target_operator}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          target_operator: v as GoalFormData['target_operator'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">Greater than</SelectItem>
                        <SelectItem value="less_than">Less than</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_value">Value *</Label>
                    <Input
                      id="target_value"
                      value={formData.target_value}
                      onChange={(e) =>
                        setFormData({ ...formData, target_value: e.target.value })
                      }
                      placeholder={
                        formData.goal_type === 'page_view'
                          ? '/thank-you'
                          : formData.goal_type === 'event'
                          ? 'purchase'
                          : '300'
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conversion_value">Conversion Value ($)</Label>
                  <Input
                    id="conversion_value"
                    type="number"
                    value={formData.conversion_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conversion_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Assign a monetary value to each conversion
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingGoal ? 'Save Changes' : 'Create Goal'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm">Total Completions</span>
            </div>
            <p className="text-3xl font-bold">{formatNumber(totalCompletions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Avg. Conversion Rate</span>
            </div>
            <p className="text-3xl font-bold">{formatPercentage(avgConversionRate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-sm">Total Value</span>
            </div>
            <p className="text-3xl font-bold">
              ${formatNumber(totalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Goals</CardTitle>
          <CardDescription>
            {goals.length} goal{goals.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first conversion goal to start tracking
              </p>
              {canEdit && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Completions</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => {
                  const perf = getGoalPerformance(goal.id);
                  const Icon = getGoalTypeIcon(goal.goal_type);
                  const isPositiveChange = (perf?.change || 0) > 0;
                  const isNegativeChange = (perf?.change || 0) < 0;

                  return (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          {goal.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {getGoalTypeLabel(goal.goal_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {goal.target_operator} {goal.target_value}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(perf?.completions || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(perf?.conversion_rate || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${formatNumber(perf?.total_value || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isPositiveChange
                              ? 'text-green-600'
                              : isNegativeChange
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                          }
                        >
                          {isPositiveChange && <TrendingUp className="inline h-3 w-3 mr-1" />}
                          {isNegativeChange && <TrendingDown className="inline h-3 w-3 mr-1" />}
                          {!isPositiveChange && !isNegativeChange && (
                            <Minus className="inline h-3 w-3 mr-1" />
                          )}
                          {Math.abs(perf?.change || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={goal.is_active ? 'default' : 'secondary'}>
                          {goal.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
