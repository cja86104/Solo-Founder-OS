'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Task,
  Project,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  getStatusLabel,
  getPriorityLabel,
} from '@/types/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Calendar as CalendarIcon, X, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  project_id: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.date().optional(),
  start_date: z.date().optional(),
  estimated_hours: z.number().min(0).optional(),
  tags: z.array(z.string()),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done', 'cancelled'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

interface TaskFormProps {
  task?: Task | null;
  projects?: Project[];
  teamMembers?: { id: string; full_name: string | null }[];
  defaultProjectId?: string;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TaskForm({
  task,
  projects = [],
  teamMembers: _teamMembers = [],
  defaultProjectId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TaskFormProps) {
  const [newTag, setNewTag] = useState('');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      project_id: task?.project_id || defaultProjectId || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      start_date: task?.start_date ? new Date(task.start_date) : undefined,
      estimated_hours: task?.estimated_hours || undefined,
      tags: task?.tags || [],
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

  const handleSubmit = async (data: TaskFormValues) => {
    await onSubmit({
      title: data.title,
      description: data.description,
      project_id: data.project_id || undefined,
      status: data.status,
      priority: data.priority,
      due_date: data.due_date?.toISOString(),
      start_date: data.start_date?.toISOString(),
      estimated_hours: data.estimated_hours,
      tags: data.tags,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="What needs to be done?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add more details..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project */}
        {projects.length > 0 && (
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.icon} {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
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
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {getPriorityLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
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
                        {field.value ? format(field.value, 'PPP') : 'Pick date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
                <FormLabel>Due Date</FormLabel>
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
                        {field.value ? format(field.value, 'PPP') : 'Pick date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
        </div>

        {/* Estimated Hours */}
        <FormField
          control={form.control}
          name="estimated_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Hours</FormLabel>
              <FormControl>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="pl-10"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
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
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projects?: Project[];
  teamMembers?: { id: string; full_name: string | null }[];
  defaultProjectId?: string;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projects,
  teamMembers,
  defaultProjectId,
  onSubmit,
}: TaskFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateTaskInput) => {
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update task details.' : 'Add a new task to your project.'}
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          task={task}
          projects={projects}
          teamMembers={teamMembers}
          defaultProjectId={defaultProjectId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
