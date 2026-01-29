'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ContentPost,
  ContentType,
  ContentPlatform,
  CreatePostInput,
  getContentTypeLabel,
  getPlatformLabel,
  generateSlug,
} from '@/types/content';
import { PostEditor } from '@/components/content/editors/post-editor';
import { ThreadEditor, type ThreadSegment } from '@/components/content/editors/thread-editor';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Calendar as CalendarIcon,
  X,
  Plus,
  Sparkles,
  Clock,
  Check,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const postFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  content_type: z.enum([
    'post',
    'article',
    'thread',
    'newsletter',
    'video_script',
    'podcast_notes',
  ]),
  platforms: z.array(z.string()),
  tags: z.array(z.string()),
  category: z.string().optional(),
  slug: z.string().optional(),
  meta_description: z.string().optional(),
  scheduled_at: z.date().optional(),
  media_urls: z.array(z.string()).optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

const CONTENT_TYPES: ContentType[] = [
  'post',
  'article',
  'thread',
];

const PLATFORMS: ContentPlatform[] = [
  'twitter',
  'linkedin',
  'facebook',
  'instagram',
  'youtube',
  'medium',
  'substack',
  'blog',
];

interface PostFormProps {
  post?: (ContentPost & Record<string, unknown>) | null;
  onSubmit: (data: CreatePostInput & { media_urls?: string[] }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  onSuccess?: () => void;
  onGenerateAI?: (prompt: string) => Promise<string>;
  workspaceId: string;
}

export function PostForm({
  post,
  onSubmit,
  onCancel,
  isSubmitting = false,
  onGenerateAI,
  workspaceId,
}: PostFormProps) {
  const [newTag, setNewTag] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showSchedule, setShowSchedule] = useState(!!post?.scheduled_at);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    ((post as Record<string, unknown>)?.media_urls as string[]) || []
  );
  const [threadSegments, setThreadSegments] = useState<ThreadSegment[]>(() => {
    if ((post as Record<string, unknown>)?.content_type === 'thread' && post?.content) {
      try {
        const parsed = JSON.parse(post.content);
        if (parsed.segments) return parsed.segments;
      } catch {
        // not JSON, use as first segment
      }
    }
    return [{ text: post?.content || '' }];
  });

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || '',
      content: post?.content || '',
      content_type: ((post as Record<string, unknown>)?.content_type as PostFormValues['content_type']) || 'post',
      platforms: (post?.platforms as string[]) || [],
      tags: (post?.tags as string[]) || [],
      category: (post as Record<string, unknown>)?.category as string || '',
      slug: (post as Record<string, unknown>)?.slug as string || '',
      meta_description: (post as Record<string, unknown>)?.meta_description as string || '',
      scheduled_at: post?.scheduled_at ? new Date(post.scheduled_at) : undefined,
      media_urls: ((post as Record<string, unknown>)?.media_urls as string[]) || [],
    },
  });

  const currentTags = form.watch('tags');
  const currentPlatforms = form.watch('platforms');
  const contentType = form.watch('content_type');
  const title = form.watch('title');

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

  const togglePlatform = (platform: string) => {
    if (currentPlatforms.includes(platform as ContentPlatform)) {
      form.setValue(
        'platforms',
        currentPlatforms.filter((p) => p !== platform)
      );
    } else {
      form.setValue('platforms', [...currentPlatforms, platform as ContentPlatform]);
    }
  };

  const handleGenerateSlug = () => {
    if (title) {
      form.setValue('slug', generateSlug(title));
    }
  };

  const handleGenerateAI = async () => {
    if (!onGenerateAI || !aiPrompt) return;

    setIsGenerating(true);
    try {
      const generated = await onGenerateAI(aiPrompt);
      form.setValue('content', generated);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (data: PostFormValues) => {
    let scheduledAt = data.scheduled_at;
    if (scheduledAt && scheduleTime) {
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      scheduledAt = new Date(scheduledAt);
      scheduledAt.setHours(hours, minutes, 0, 0);
    }

    // For threads, serialize segments as JSON
    let finalContent = data.content;
    if (data.content_type === 'thread') {
      finalContent = JSON.stringify({ segments: threadSegments });
    }

    await onSubmit({
      title: data.title,
      content: finalContent,
      content_type: data.content_type,
      platforms: data.platforms as ContentPlatform[],
      tags: data.tags,
      category: data.category || undefined,
      slug: data.slug || undefined,
      meta_description: data.meta_description || undefined,
      scheduled_at: scheduledAt?.toISOString(),
      status: scheduledAt ? 'scheduled' : undefined,
      media_urls: mediaUrls,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a compelling title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Type */}
            <FormField
              control={form.control}
              name="content_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getContentTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value === 'article' && !post && (
                    <p className="text-xs text-muted-foreground">
                      Articles open in a full-page editor after saving.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content - Dynamic Editor */}
            {contentType === 'thread' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Thread Segments</Label>
                </div>
                <ThreadEditor
                  segments={threadSegments}
                  onChange={setThreadSegments}
                  workspaceId={workspaceId}
                />
              </div>
            ) : contentType === 'article' && post ? (
              <div className="rounded-lg border p-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Use the full-page editor for article content.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    window.open(`/content/edit/${post.id}`, '_self')
                  }
                >
                  Open Full Editor
                </Button>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Content</FormLabel>
                      {onGenerateAI && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              <Sparkles className="h-4 w-4 mr-1" />
                              AI Generate
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-3">
                              <Label>What should the AI write about?</Label>
                              <Textarea
                                placeholder="e.g., Write a LinkedIn post about productivity tips for founders..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                rows={3}
                              />
                              <Button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={isGenerating || !aiPrompt}
                                className="w-full"
                              >
                                {isGenerating ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                Generate
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <FormControl>
                      <PostEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        mediaUrls={mediaUrls}
                        onMediaChange={setMediaUrls}
                        platforms={currentPlatforms}
                        workspaceId={workspaceId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Tags */}
            <div className="space-y-3">
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
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Select the platforms where you want to publish this content.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((platform) => {
                const isSelected = currentPlatforms.includes(platform);
                return (
                  <div
                    key={platform}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => togglePlatform(platform)}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center h-4 w-4 shrink-0 rounded-sm border shadow',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-primary'
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span>{getPlatformLabel(platform)}</span>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Schedule */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Schedule Post</Label>
                <Switch checked={showSchedule} onCheckedChange={setShowSchedule} />
              </div>
              {showSchedule && (
                <div className="flex gap-3">
                  <FormField
                    control={form.control}
                    name="scheduled_at"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'flex-1 justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP') : 'Pick date'}
                          </Button>
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
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* SEO */}
            <div className="space-y-4">
              <h4 className="font-medium">SEO Settings</h4>

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="my-awesome-post" {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={handleGenerateSlug}>
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description for search engines..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Marketing, Product" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <div>
            {post && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(`/content/preview/${post.id}`, '_blank')
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {post ? 'Save Changes' : showSchedule ? 'Schedule' : 'Save Draft'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: (ContentPost & Record<string, unknown>) | null;
  onSubmit: (data: CreatePostInput & { media_urls?: string[] }) => Promise<void>;
  onGenerateAI?: (prompt: string) => Promise<string>;
  workspaceId: string;
}

export function PostFormDialog({
  open,
  onOpenChange,
  post,
  onSubmit,
  onGenerateAI,
  workspaceId,
}: PostFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreatePostInput & { media_urls?: string[] }) => {
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          <DialogDescription>
            {post ? 'Update your content.' : 'Create content for your audience.'}
          </DialogDescription>
        </DialogHeader>

        <PostForm
          post={post}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          onGenerateAI={onGenerateAI}
          workspaceId={workspaceId}
        />
      </DialogContent>
    </Dialog>
  );
}
