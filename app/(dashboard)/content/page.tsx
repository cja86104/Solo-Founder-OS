'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PostFormDialog } from '@/components/content/post-form';
import { PostCard } from '@/components/content/post-card';
import { ContentCalendar } from '@/components/content/content-calendar';
import {
  Plus,
  FileText,
  Calendar,
  Lightbulb,
  Loader2,
  ChevronDown,
  PenLine,
  Sparkles,
  BarChart3,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ContentPostWithAuthor } from '@/types/content';

interface ContentAnalytics {
  summary: {
    total: number;
    published: number;
    scheduled: number;
    drafts: number;
    archived: number;
    published_last_30_days: number;
  };
  engagement: {
    total_views: number;
    total_likes: number;
    total_shares: number;
    total_comments: number;
  };
  byType: Record<string, number>;
  byPlatform: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  weeklyActivity: Array<{ week: string; count: number }>;
  topPosts: Array<{
    id: string;
    title: string;
    content_type: string;
    platforms: string[];
    published_at: string;
  }>;
}

export default function ContentPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [posts, setPosts] = useState<ContentPostWithAuthor[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPostWithAuthor | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');

  // AI idea generation state
  const [aiIdeaPrompt, setAiIdeaPrompt] = useState('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      let url = `/api/content/posts?workspace_id=${currentWorkspace.id}`;
      if (contentTypeFilter && contentTypeFilter !== 'all') {
        url += `&content_type=${contentTypeFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const { posts } = await res.json();
        setPosts(posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  }, [currentWorkspace, contentTypeFilter]);

  const fetchIdeas = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      const res = await fetch(`/api/content/ideas?workspace_id=${currentWorkspace.id}`);
      if (res.ok) {
        const { data } = await res.json();
        setIdeas(data || []);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    }
  }, [currentWorkspace]);

  const fetchAnalytics = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/content/analytics?workspace_id=${currentWorkspace.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [currentWorkspace]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPosts(), fetchIdeas()]);
    setIsLoading(false);
  }, [fetchPosts, fetchIdeas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch analytics when the tab is selected
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);

  // ── Create handlers ──────────────────────────────────────────────────────

  const handleCreatePost = () => {
    setEditingPost(null);
    setIsDialogOpen(true);
  };

  const handleCreateArticle = async () => {
    if (!currentWorkspace) return;

    try {
      const res = await fetch('/api/content/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          title: 'Untitled Article',
          content: '',
          content_type: 'article',
          platforms: [],
          tags: [],
        }),
      });

      if (!res.ok) {
        toast.error('Failed to create article');
        return;
      }

      const { post } = await res.json();
      router.push(`/content/edit/${post.id}`);
    } catch {
      toast.error('Failed to create article');
    }
  };

  const handlePreviewPost = (post: ContentPostWithAuthor) => {
    window.open(`/content/preview/${post.id}`, '_blank');
  };

  const handleEditPost = (post: ContentPostWithAuthor) => {
    if ((post as any).content_type === 'article') {
      router.push(`/content/edit/${post.id}`);
      return;
    }
    setEditingPost(post);
    setIsDialogOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentWorkspace) return;

    try {
      const res = await fetch(`/api/content/posts/${postId}?workspace_id=${currentWorkspace.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Post deleted');
        fetchPosts();
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  // ── Part 5: Content Actions ──────────────────────────────────────────────

  const handleSaveLocal = (post: ContentPostWithAuthor) => {
    const contentType = (post as any).content_type || 'post';
    const safeTitle = (post.title || 'untitled').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const mediaUrls: string[] = (post as any).media_urls || [];
    const platforms = (post.platforms || []).join(', ');
    const tags = (post.tags || []).join(', ');

    let bodyContent = '';

    if (contentType === 'thread') {
      try {
        const parsed = JSON.parse(post.content || '{}');
        if (parsed.segments) {
          bodyContent = parsed.segments
            .map((s: { text: string; media_url?: string }, i: number) => {
              let segment = `<div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:12px;">`;
              segment += `<p style="color:#666;font-size:13px;margin:0 0 8px 0;"><strong>${i + 1}/${parsed.segments.length}</strong></p>`;
              segment += `<div>${s.text}</div>`;
              if (s.media_url) {
                segment += renderMedia(s.media_url);
              }
              segment += `</div>`;
              return segment;
            })
            .join('\n');
        } else {
          bodyContent = `<div>${post.content || ''}</div>`;
        }
      } catch {
        bodyContent = `<div>${post.content || ''}</div>`;
      }
    } else {
      bodyContent = post.content || '';
    }

    // Build media section for non-thread post-level media
    let mediaSection = '';
    if (mediaUrls.length > 0 && contentType !== 'thread') {
      mediaSection = '<div style="margin-top:20px;">';
      for (const url of mediaUrls) {
        mediaSection += renderMedia(url);
      }
      mediaSection += '</div>';
    }

    // Build full HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title || 'Untitled'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; max-width: 720px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 12px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
    .meta span { margin-right: 16px; }
    .content { font-size: 16px; }
    .content p { margin-bottom: 12px; }
    .content h2 { font-size: 22px; margin: 24px 0 12px; }
    .content h3 { font-size: 18px; margin: 20px 0 10px; }
    .content ul, .content ol { margin: 12px 0; padding-left: 24px; }
    .content blockquote { border-left: 3px solid #ddd; padding-left: 16px; color: #555; margin: 12px 0; }
    .content img, .content video { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
    .tag { display: inline-block; background: #f0f0f0; border-radius: 4px; padding: 2px 8px; font-size: 13px; margin-right: 6px; }
  </style>
</head>
<body>
  <h1>${post.title || 'Untitled'}</h1>
  <div class="meta">
    <span><strong>Type:</strong> ${contentType}</span>
    ${platforms ? `<span><strong>Platforms:</strong> ${platforms}</span>` : ''}
    ${tags ? `<br><strong>Tags:</strong> ${(post.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ')}` : ''}
  </div>
  <div class="content">
    ${bodyContent}
    ${mediaSection}
  </div>
</body>
</html>`;

    const filename = `${safeTitle}_${contentType}.html`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Saved as ${filename}`);
  };

  function renderMedia(url: string): string {
    const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
    if (isVideo) {
      return `<video controls style="max-width:100%;border-radius:8px;margin:12px 0;" src="${url}"></video>`;
    }
    return `<img style="max-width:100%;border-radius:8px;margin:12px 0;" src="${url}" />`;
  }

  const handleDuplicatePost = async (post: ContentPostWithAuthor) => {
    if (!currentWorkspace) return;

    try {
      const res = await fetch('/api/content/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          title: `Copy of ${post.title || 'Untitled'}`,
          content: post.content || '',
          content_type: (post as any).content_type || 'post',
          platforms: post.platforms || [],
          tags: post.tags || [],
          slug: null,
          meta_description: (post as any).meta_description || null,
          category: (post as any).category || null,
          media_urls: (post as any).media_urls || [],
        }),
      });

      if (res.ok) {
        toast.success('Post duplicated');
        fetchPosts();
      } else {
        toast.error('Failed to duplicate post');
      }
    } catch {
      toast.error('Failed to duplicate post');
    }
  };

  const handleArchivePost = async (post: ContentPostWithAuthor) => {
    if (!currentWorkspace) return;

    try {
      const res = await fetch(
        `/api/content/posts/${post.id}?workspace_id=${currentWorkspace.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' }),
        }
      );

      if (res.ok) {
        toast.success('Post archived');
        fetchPosts();
      } else {
        toast.error('Failed to archive post');
      }
    } catch {
      toast.error('Failed to archive post');
    }
  };

  // ── Part 4: AI Generation ────────────────────────────────────────────────

  const handleGenerateAI = async (prompt: string): Promise<string> => {
    if (!currentWorkspace) return '';

    const res = await fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: currentWorkspace.id,
        prompt,
        mode: 'generate',
      }),
    });

    if (!res.ok) {
      toast.error('AI generation failed');
      return '';
    }

    const { content } = await res.json();
    return content || '';
  };

  const handleGenerateIdeas = async () => {
    if (!currentWorkspace || !aiIdeaPrompt.trim()) return;

    setIsGeneratingIdeas(true);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          prompt: aiIdeaPrompt,
          mode: 'ideas',
        }),
      });

      if (!res.ok) {
        toast.error('Failed to generate ideas');
        return;
      }

      const { ideas: generatedIdeas } = await res.json();

      // Save each idea
      let savedCount = 0;
      for (const idea of generatedIdeas || []) {
        const saveRes = await fetch('/api/content/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: currentWorkspace.id,
            title: idea.title,
            content: idea.description,
          }),
        });
        if (saveRes.ok) savedCount++;
      }

      toast.success(`${savedCount} ideas generated and saved!`);
      setAiIdeaPrompt('');
      fetchIdeas();
    } catch {
      toast.error('Failed to generate ideas');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!currentWorkspace) return;

    try {
      const res = await fetch(`/api/content/ideas?id=${ideaId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Idea deleted');
        fetchIdeas();
      }
    } catch {
      toast.error('Failed to delete idea');
    }
  };

  const handlePromoteIdea = (idea: any) => {
    setEditingPost(null);
    setIsDialogOpen(true);
    // Pre-fill will happen through the dialog open; we set a dummy post-like object
    // Instead, let's just create a new post from the idea
    setTimeout(async () => {
      if (!currentWorkspace) return;
      try {
        const res = await fetch('/api/content/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: currentWorkspace.id,
            title: idea.title,
            content: idea.content || '',
            content_type: 'post',
            platforms: [],
            tags: idea.tags || [],
          }),
        });
        if (res.ok) {
          const { post } = await res.json();
          // Delete the idea
          await fetch(`/api/content/ideas?id=${idea.id}`, { method: 'DELETE' });
          toast.success('Idea promoted to draft post');
          setIsDialogOpen(false);
          fetchPosts();
          fetchIdeas();
          // Open the new post for editing
          setEditingPost({ ...post, engagement: { views: 0, likes: 0, shares: 0, comments: 0 } });
          setIsDialogOpen(true);
        }
      } catch {
        toast.error('Failed to promote idea');
      }
    }, 100);
  };

  const handleDialogClose = (refresh?: boolean) => {
    setIsDialogOpen(false);
    setEditingPost(null);
    if (refresh) {
      fetchPosts();
    }
  };

  // Stats
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a workspace to view content</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Engine</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage your content
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Content
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCreatePost}>
              <FileText className="h-4 w-4 mr-2" />
              Post / Thread
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateArticle}>
              <PenLine className="h-4 w-4 mr-2" />
              Article
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="posts">
              <FileText className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="ideas">
              <Lightbulb className="h-4 w-4 mr-2" />
              Ideas ({ideas.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab === 'posts' && (
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="thread">Threads</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first post to get started
                </p>
                <Button onClick={handleCreatePost}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => handlePreviewPost(post)}
                  onEdit={() => handleEditPost(post)}
                  onDelete={() => handleDeletePost(post.id)}
                  onDuplicate={() => handleDuplicatePost(post)}
                  onSaveLocal={() => handleSaveLocal(post)}
                  onArchive={() => handleArchivePost(post)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6">
          <ContentCalendar posts={posts} onPostClick={handlePreviewPost} />
        </TabsContent>

        {/* Ideas Tab - with AI Generation */}
        <TabsContent value="ideas" className="mt-6 space-y-6">
          {/* AI Idea Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Idea Generator
              </CardTitle>
              <CardDescription>
                Describe your audience or topic and let AI generate content ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Textarea
                  placeholder="e.g., Content ideas for a SaaS founder about productivity, growth hacking, and building in public..."
                  value={aiIdeaPrompt}
                  onChange={(e) => setAiIdeaPrompt(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleGenerateIdeas}
                  disabled={isGeneratingIdeas || !aiIdeaPrompt.trim()}
                  className="shrink-0"
                >
                  {isGeneratingIdeas ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Ideas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Idea Capture */}
          <IdeaQuickCapture
            workspaceId={currentWorkspace.id}
            onCreated={fetchIdeas}
          />

          {/* Ideas Grid */}
          {ideas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
                <p className="text-muted-foreground">
                  Use the AI generator above or capture your own ideas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <Card key={idea.id} className="group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{idea.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteIdea(idea.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {idea.content && (
                      <CardDescription>{idea.content}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {(idea.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {idea.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePromoteIdea(idea)}
                    >
                      <PenLine className="h-3.5 w-3.5 mr-2" />
                      Create Post from Idea
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : analytics ? (
            <ContentAnalyticsView analytics={analytics} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No analytics data</h3>
                <p className="text-muted-foreground">
                  Start publishing content to see analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Post Form Dialog */}
      <PostFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}
        post={editingPost as any}
        workspaceId={currentWorkspace.id}
        onGenerateAI={handleGenerateAI}
        onSubmit={async (data) => {
          if (!currentWorkspace) return;

          const url = editingPost
            ? `/api/content/posts/${editingPost.id}?workspace_id=${currentWorkspace.id}`
            : '/api/content/posts';
          const method = editingPost ? 'PATCH' : 'POST';

          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, workspace_id: currentWorkspace.id }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            toast.error(err.error || 'Failed to save post');
            return;
          }

          const { post: savedPost } = await res.json();

          // If creating a new article, redirect to full editor
          if (!editingPost && data.content_type === 'article' && savedPost?.id) {
            router.push(`/content/edit/${savedPost.id}`);
            return;
          }

          toast.success(editingPost ? 'Post updated' : 'Post created');
          fetchPosts();
        }}
      />
    </div>
  );
}

// ─── Quick Idea Capture ─────────────────────────────────────────────────────

function IdeaQuickCapture({
  workspaceId,
  onCreated,
}: {
  workspaceId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/content/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title: title.trim(),
        }),
      });
      if (res.ok) {
        setTitle('');
        toast.success('Idea captured');
        onCreated();
      }
    } catch {
      toast.error('Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Input
        placeholder="Quick capture: type an idea and press Enter..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) {
            e.preventDefault();
            handleSave();
          }
        }}
        className="flex-1"
      />
      <Button onClick={handleSave} disabled={isSaving || !title.trim()} variant="outline">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// ─── Analytics View ─────────────────────────────────────────────────────────

function ContentAnalyticsView({ analytics }: { analytics: ContentAnalytics }) {
  const { summary, engagement, byType, byPlatform, topTags, weeklyActivity, topPosts } = analytics;

  const maxWeekly = Math.max(...weeklyActivity.map((w) => w.count), 1);

  return (
    <div className="space-y-6">
      {/* Engagement Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagement.total_views.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagement.total_likes.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagement.total_shares.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagement.total_comments.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Publishing Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Publishing Activity (Last 4 Weeks)
            </CardTitle>
            <CardDescription>
              {summary.published_last_30_days} posts published in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyActivity.map((week) => (
                <div key={week.week} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{week.week}</span>
                    <span className="font-medium">{week.count}</span>
                  </div>
                  <Progress value={(week.count / maxWeekly) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Breakdown</CardTitle>
            <CardDescription>Posts by type and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* By Type */}
            <div>
              <p className="text-sm font-medium mb-2">By Type</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(byType).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-sm">
                    {type}: {count}
                  </Badge>
                ))}
                {Object.keys(byType).length === 0 && (
                  <span className="text-sm text-muted-foreground">No data</span>
                )}
              </div>
            </div>

            {/* By Status */}
            <div>
              <p className="text-sm font-medium mb-2">By Status</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950/20">
                  <span>Published</span>
                  <span className="font-medium">{summary.published}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                  <span>Scheduled</span>
                  <span className="font-medium">{summary.scheduled}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-50 dark:bg-yellow-950/20">
                  <span>Drafts</span>
                  <span className="font-medium">{summary.drafts}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-950/20">
                  <span>Archived</span>
                  <span className="font-medium">{summary.archived}</span>
                </div>
              </div>
            </div>

            {/* By Platform */}
            {Object.keys(byPlatform).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">By Platform</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(byPlatform)
                    .sort((a, b) => b[1] - a[1])
                    .map(([platform, count]) => (
                      <Badge key={platform} variant="secondary" className="text-sm">
                        {platform}: {count}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Tags</CardTitle>
              <CardDescription>Most frequently used tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topTags.map((item) => (
                  <div key={item.tag} className="flex items-center justify-between">
                    <Badge variant="outline">{item.tag}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.count} post{item.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Posts */}
        {topPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recently Published</CardTitle>
              <CardDescription>Your latest published content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{post.title || 'Untitled'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.content_type}</span>
                        {post.platforms?.length > 0 && (
                          <span>{post.platforms.length} platform(s)</span>
                        )}
                      </div>
                    </div>
                    {post.published_at && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
