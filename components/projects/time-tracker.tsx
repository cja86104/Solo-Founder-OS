'use client';

import { useState, useEffect } from 'react';
import { TimeEntryWithRelations, formatDuration } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, Trash2 } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TimeTrackerProps {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  onEntryCreated?: (entry: TimeEntryWithRelations) => void;
}

export function TimeTracker({
  workspaceId,
  projectId,
  taskId,
  onEntryCreated,
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsed(differenceInSeconds(new Date(), startTime));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatElapsed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setStartTime(new Date());
    setIsRunning(true);
    setElapsed(0);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    if (startTime) {
      // Adjust start time to account for paused time
      const pausedAt = new Date(Date.now() - elapsed * 1000);
      setStartTime(pausedAt);
    }
    setIsRunning(true);
  };

  const handleStop = async () => {
    if (!startTime) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/projects/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          task_id: taskId,
          description: description || null,
          started_at: startTime.toISOString(),
          ended_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save time entry');

      const { entry } = await response.json();
      onEntryCreated?.(entry);
      toast.success('Time entry saved');

      // Reset
      setIsRunning(false);
      setStartTime(null);
      setElapsed(0);
      setDescription('');
    } catch (error) {
      toast.error('Failed to save time entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsed(0);
    setDescription('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <p
            className={cn(
              'text-4xl font-mono font-bold',
              isRunning && 'text-primary'
            )}
          >
            {formatElapsed(elapsed)}
          </p>
          {startTime && (
            <p className="text-sm text-muted-foreground mt-1">
              Started at {format(startTime, 'h:mm a')}
            </p>
          )}
        </div>

        {/* Description Input */}
        <Input
          placeholder="What are you working on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving}
        />

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {!isRunning && !startTime && (
            <Button onClick={handleStart} className="gap-2">
              <Play className="h-4 w-4" />
              Start
            </Button>
          )}

          {isRunning && (
            <>
              <Button onClick={handlePause} variant="outline" className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={handleStop}
                variant="default"
                className="gap-2"
                disabled={isSaving}
              >
                <Square className="h-4 w-4" />
                Stop & Save
              </Button>
            </>
          )}

          {!isRunning && startTime && (
            <>
              <Button onClick={handleResume} className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
              <Button
                onClick={handleStop}
                variant="default"
                className="gap-2"
                disabled={isSaving}
              >
                <Square className="h-4 w-4" />
                Stop & Save
              </Button>
              <Button
                onClick={handleDiscard}
                variant="ghost"
                size="icon"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TimeEntryListProps {
  entries: TimeEntryWithRelations[];
  onDelete?: (entry: TimeEntryWithRelations) => void;
}

export function TimeEntryList({ entries, onDelete }: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No time entries yet</p>
      </div>
    );
  }

  // Group by date
  const grouped = entries.reduce((acc, entry) => {
    const date = format(new Date(entry.started_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntryWithRelations[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayEntries]) => {
        const totalMinutes = dayEntries.reduce(
          (sum, e) => sum + (e.duration_minutes || 0),
          0
        );

        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">
                {format(new Date(date), 'EEEE, MMMM d')}
              </h4>
              <Badge variant="outline">{formatDuration(totalMinutes)}</Badge>
            </div>
            <div className="space-y-2">
              {dayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {entry.project && (
                        <span>{entry.project.icon} {entry.project.name}</span>
                      )}
                      {entry.task && (
                        <span>• {entry.task.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {formatDuration(entry.duration_minutes || 0)}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(entry.started_at), 'h:mm a')} -{' '}
                      {entry.ended_at
                        ? format(new Date(entry.ended_at), 'h:mm a')
                        : 'running'}
                    </p>
                  </div>
                  {entry.is_billable && (
                    <Badge variant="secondary" className="shrink-0">
                      Billable
                    </Badge>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      onClick={() => onDelete(entry)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
