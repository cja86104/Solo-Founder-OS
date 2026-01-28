'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { TaskCard } from '@/components/projects/task-card';
import { TaskFormDialog } from '@/components/projects/task-form';
import { TimeTracker, TimeEntryList } from '@/components/projects/time-tracker';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  ListTodo,
  Clock,
  LayoutGrid,
  List,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ProjectWithStats,
  TaskWithRelations,
  TimeEntryWithRelations,
  CreateTaskInput,
  calculateProgress,
  formatDuration,
} from '@/types/projects';

export default function ProjectsPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  // Data state
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'board'>('list');

  // Form state
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithRelations | null>(null);

  // Project form state
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      // Fetch projects
      const projectsRes = await fetch(
        `/api/projects?workspace_id=${currentWorkspace.id}`
      );
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }

      // Fetch tasks
      const params = new URLSearchParams({
        workspace_id: currentWorkspace.id,
      });
      if (selectedProjectId !== 'all') params.set('project_id', selectedProjectId);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const tasksRes = await fetch(`/api/projects/tasks?${params}`);
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }

      // Fetch time entries
      const entriesRes = await fetch(
        `/api/projects/time-entries?workspace_id=${currentWorkspace.id}&limit=20`
      );
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setTimeEntries(data.entries || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, selectedProjectId, statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== 'done' &&
        t.status !== 'cancelled'
    ).length,
  };

  // Handlers
  const handleCreateTask = async (data: CreateTaskInput) => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch('/api/projects/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...data,
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      toast.success('Task created');
      setTaskFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
      throw error;
    }
  };

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;

    try {
      const response = await fetch('/api/projects/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: editingTask.id,
          ...data,
        }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      toast.success('Task updated');
      setEditingTask(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update task');
      throw error;
    }
  };

  const handleStatusChange = async (task: TaskWithRelations, status: string) => {
    try {
      const response = await fetch('/api/projects/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          status,
        }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: status as any } : t))
      );
    } catch (error) {
      toast.error('Failed to update task');
      fetchData();
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const response = await fetch(`/api/projects/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      toast.success('Task deleted');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleCreateProject = async () => {
    if (!currentWorkspace || !newProjectName.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          name: newProjectName.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create project');

      toast.success('Project created');
      setProjectFormOpen(false);
      setNewProjectName('');
      fetchData();
    } catch (error) {
      toast.error('Failed to create project');
    }
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
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
            <p className="text-muted-foreground">
              Please select a workspace to manage projects.
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
            <FolderKanban className="h-8 w-8" />
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage tasks and track time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setProjectFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          {can('projects.create') && (
            <Button onClick={() => setTaskFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">To Do</p>
                    <p className="text-2xl font-bold">{stats.todo}</p>
                  </div>
                  <Circle className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">{stats.in_progress}</p>
                  </div>
                  <ListTodo className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Done</p>
                    <p className="text-2xl font-bold">{stats.done}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold">{stats.overdue}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tasks List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No tasks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first task to get started.
                </p>
                <Button onClick={() => setTaskFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showProject={selectedProjectId === 'all'}
                  onStatusChange={(status) => handleStatusChange(task, status)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => {
                    setTaskToDelete(task);
                    setDeleteDialogOpen(true);
                  }}
                  onClick={() => setEditingTask(task)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Tracker */}
          <TimeTracker
            workspaceId={currentWorkspace.id}
            projectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
            onEntryCreated={(entry) => {
              setTimeEntries((prev) => [entry, ...prev]);
            }}
          />

          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No projects yet
                </p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {project.icon} {project.name}
                      </span>
                      <Badge variant="outline">
                        {project.completed_tasks}/{project.total_tasks}
                      </Badge>
                    </div>
                    <Progress
                      value={calculateProgress(
                        project.completed_tasks,
                        project.total_tasks
                      )}
                      className="h-1"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Time Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimeEntryList
                entries={timeEntries.slice(0, 5)}
                onDelete={(entry) => {
                  setTimeEntries((prev) => prev.filter((e) => e.id !== entry.id));
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskFormOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setTaskFormOpen(false);
            setEditingTask(null);
          }
        }}
        task={editingTask}
        projects={projects}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{taskToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Form Dialog */}
      <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProjectFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
