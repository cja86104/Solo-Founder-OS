// ============================================================================
// Founders Helm - Project Tracker Types
// Tasks, Projects, and Time Tracking
// ============================================================================

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  owner_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithStats extends Project {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  total_estimated_hours: number;
  total_logged_hours: number;
  owner?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  project?: Project | null;
  assignee?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  subtasks?: Task[];
  comments_count?: number;
  time_logged?: number;
}

export interface TimeEntry {
  id: string;
  workspace_id: string;
  task_id: string | null;
  project_id: string | null;
  user_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  /** @deprecated Use started_at */
  start_time?: string;
  /** @deprecated Use ended_at */
  end_time?: string | null;
  duration_minutes: number | null;
  is_billable: boolean;
  is_running?: boolean;
  hourly_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryWithRelations extends TimeEntry {
  task?: Task | null;
  project?: Project | null;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Input types
export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  start_date?: string;
  due_date?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
  owner_id?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  project_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  position?: number;
}

export interface CreateTimeEntryInput {
  task_id?: string;
  project_id?: string;
  description?: string;
  started_at: string;
  ended_at?: string;
  is_billable?: boolean;
  hourly_rate?: number;
}

// Filter types
export interface TaskFilters {
  search?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  project_id?: string;
  assignee_id?: string;
  has_due_date?: boolean;
  is_overdue?: boolean;
  tags?: string[];
}

export interface TimeEntryFilters {
  project_id?: string;
  task_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  is_billable?: boolean;
}

// Stats types
export interface ProjectStats {
  total_tasks: number;
  todo_count: number;
  in_progress_count: number;
  done_count: number;
  overdue_count: number;
  completion_percentage: number;
}

export interface TimeStats {
  total_hours: number;
  billable_hours: number;
  billable_amount: number;
  entries_count: number;
}

// Utility functions
export function getStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    todo: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    review: 'bg-purple-500',
    done: 'bg-green-500',
  };
  return colors[status];
}

export function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
  };
  return labels[status];
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-400',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    urgent: 'bg-red-500',
  };
  return colors[priority];
}

export function getPriorityLabel(priority: TaskPriority): string {
  const labels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority];
}

export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    active: 'bg-green-500',
    on_hold: 'bg-amber-500',
    completed: 'bg-blue-500',
    archived: 'bg-gray-500',
  };
  return colors[status];
}

export function getProjectStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    active: 'Active',
    on_hold: 'On Hold',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status];
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
