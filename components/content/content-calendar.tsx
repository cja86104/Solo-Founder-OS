'use client';

import { useState, useMemo } from 'react';
import {
  ContentPostWithAuthor,
  CalendarDay,
  CalendarEvent,
  getContentTypeIcon,
  getStatusColor,
  getPlatformIcon,
} from '@/types/content';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentCalendarProps {
  posts: ContentPostWithAuthor[];
  onDateClick?: (date: Date) => void;
  onPostClick?: (post: ContentPostWithAuthor) => void;
  onAddPost?: (date: Date) => void;
  className?: string;
}

export function ContentCalendar({
  posts,
  onDateClick,
  onPostClick,
  onAddPost,
  className,
}: ContentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Build calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return days.map((date): CalendarDay => {
      const dayPosts = posts.filter((post) => {
        const postDate = post.scheduled_at
          ? new Date(post.scheduled_at)
          : post.published_at
          ? new Date(post.published_at)
          : null;
        return postDate && isSameDay(postDate, date);
      });

      const events: CalendarEvent[] = dayPosts.map((post) => ({
        id: post.id,
        title: post.title,
        date,
        content_type: (post as unknown as Record<string, unknown>).content_type as string || '',
        status: post.status,
        platforms: (post.platforms as string[]) || [],
      }));

      return {
        date,
        events,
        isCurrentMonth: isSameMonth(date, currentMonth),
        isToday: isToday(date),
      };
    });
  }, [currentMonth, posts]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className={cn('bg-card rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              'min-h-[100px] border-b border-r p-1 transition-colors',
              !day.isCurrentMonth && 'bg-muted/30',
              day.isToday && 'bg-primary/5',
              'hover:bg-muted/50 cursor-pointer'
            )}
            onClick={() => onDateClick?.(day.date)}
          >
            {/* Date number */}
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
                  !day.isCurrentMonth && 'text-muted-foreground',
                  day.isToday && 'bg-primary text-primary-foreground'
                )}
              >
                {format(day.date, 'd')}
              </span>
              {day.isCurrentMonth && onAddPost && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPost(day.date);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Events */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => (
                <CalendarEventItem
                  key={event.id}
                  event={event}
                  post={posts.find((p) => p.id === event.id)!}
                  onClick={onPostClick}
                />
              ))}
              {day.events.length > 3 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground w-full text-left px-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      +{day.events.length - 3} more
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      {day.events.map((event) => (
                        <CalendarEventItem
                          key={event.id}
                          event={event}
                          post={posts.find((p) => p.id === event.id)!}
                          onClick={onPostClick}
                          expanded
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CalendarEventItemProps {
  event: CalendarEvent;
  post: ContentPostWithAuthor;
  onClick?: (post: ContentPostWithAuthor) => void;
  expanded?: boolean;
}

function CalendarEventItem({
  event,
  post,
  onClick,
  expanded = false,
}: CalendarEventItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-1 px-1 py-0.5 rounded text-xs cursor-pointer transition-colors',
        'hover:bg-muted',
        getStatusColor(event.status).replace('bg-', 'border-l-2 border-')
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(post);
      }}
    >
      <span>{getContentTypeIcon(event.content_type)}</span>
      <span className="truncate flex-1">{event.title}</span>
      {expanded && event.platforms.length > 0 && (
        <div className="flex gap-0.5">
          {event.platforms.slice(0, 2).map((p) => (
            <span key={p} className="text-[10px]">
              {getPlatformIcon(p)}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (expanded) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {event.status} • {event.platforms.join(', ')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Mini calendar for sidebar
interface MiniCalendarProps {
  posts: ContentPostWithAuthor[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export function MiniCalendar({
  posts,
  onDateSelect,
  selectedDate,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayPostCount = (date: Date): number => {
    return posts.filter((post) => {
      const postDate = post.scheduled_at || post.published_at;
      return postDate && isSameDay(new Date(postDate), date);
    }).length;
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'MMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const postCount = getDayPostCount(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={i}
              className={cn(
                'h-6 w-6 text-xs rounded-full flex items-center justify-center relative',
                !isSameMonth(day, currentMonth) && 'text-muted-foreground/50',
                isToday(day) && 'border border-primary',
                isSelected && 'bg-primary text-primary-foreground',
                !isSelected && 'hover:bg-muted'
              )}
              onClick={() => onDateSelect?.(day)}
            >
              {format(day, 'd')}
              {postCount > 0 && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
