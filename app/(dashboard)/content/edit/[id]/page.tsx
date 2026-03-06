'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { ArticleEditor } from '@/components/content/editors/article-editor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusColor, getStatusLabel } from '@/types/content';

export default function ArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
interface ArticlePost {
  id: string;
  title: string | null;
  content: string;
  slug: string | null;
  meta_description: string | null;
  category: string | null;
  status: string | null;
}

const [post, setPost] = useState<ArticlePost | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [category, setCategory] = useState('');

  const fetchPost = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const res = await fetch(
        `/api/content/posts/${id}?workspace_id=${currentWorkspace.id}`
      );
      if (!res.ok) {
        toast.error('Post not found');
        router.push('/content');
        return;
      }
      const { post } = await res.json();
      setPost(post);
      setTitle(post.title || '');
      setContent(post.content || '');
      setSlug(post.slug || '');
      setMetaDescription(post.meta_description || '');
      setCategory(post.category || '');
    } catch {
      toast.error('Failed to load post');
      router.push('/content');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentWorkspace, router]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleSave = async () => {
    if (!currentWorkspace || !post) return;
    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/content/posts/${id}?workspace_id=${currentWorkspace.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            slug: slug || undefined,
            meta_description: metaDescription || undefined,
            category: category || undefined,
          }),
        }
      );
      if (!res.ok) {
        toast.error('Failed to save');
        return;
      }
      const { post: updated } = await res.json();
      setPost(updated);
      toast.success('Article saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post || !currentWorkspace) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/content')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Edit Article</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={getStatusColor(post.status)}>
                {getStatusLabel(post.status)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              window.open(`/content/preview/${id}`, '_blank')
            }
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <ArticleEditor
        content={content}
        onChange={setContent}
        title={title}
        onTitleChange={setTitle}
        slug={slug}
        onSlugChange={setSlug}
        metaDescription={metaDescription}
        onMetaDescriptionChange={setMetaDescription}
        category={category}
        onCategoryChange={setCategory}
        workspaceId={currentWorkspace.id}
      />
    </div>
  );
}
