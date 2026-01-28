'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PostFormDialog } from '@/components/content/post-form';
import { PostCard } from '@/components/content/post-card';
import { ContentCalendar } from '@/components/content/content-calendar';
import { Plus, FileText, Calendar, Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ContentPostWithAuthor } from '@/types/content';

export default function ContentPage() {
  const { currentWorkspace } = useWorkspace();
  const [posts, setPosts] = useState<ContentPostWithAuthor[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPostWithAuthor | null>(null);
  const [activeTab, setActiveTab] = useState('posts');

  const fetchPosts = useCallback(async () => {
    if (!currentWorkspace) return;
    
    try {
      const res = await fetch(`/api/content/posts?workspace_id=${currentWorkspace.id}`);
      if (res.ok) {
        const { data } = await res.json();
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  }, [currentWorkspace]);

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPosts(), fetchIdeas()]);
    setIsLoading(false);
  }, [fetchPosts, fetchIdeas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePost = () => {
    setEditingPost(null);
    setIsDialogOpen(true);
  };

  const handleEditPost = (post: ContentPostWithAuthor) => {
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
        <Button onClick={handleCreatePost}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
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
        </TabsList>

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
                  onEdit={() => handleEditPost(post)}
                  onDelete={() => handleDeletePost(post.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <ContentCalendar posts={posts} onPostClick={handleEditPost} />
        </TabsContent>

        <TabsContent value="ideas" className="mt-6">
          {ideas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
                <p className="text-muted-foreground">
                  Start capturing content ideas for later
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <Card key={idea.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{idea.title}</CardTitle>
                    {idea.description && (
                      <CardDescription>{idea.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
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
        onSubmit={async () => { handleDialogClose(true); }}
      />
    </div>
  );
}
