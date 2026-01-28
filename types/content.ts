import type { Database, Json } from './database';

export type ContentPost = Database['public']['Tables']['content_posts']['Row'];

// Extended type with author info for UI
export interface ContentPostWithAuthor extends ContentPost {
  content_type: ContentType;
  thumbnail_url?: string | null;
  engagement: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type ContentType = 'blog' | 'social' | 'newsletter' | 'video' | 'other' | 'post' | 'article' | 'thread' | 'video_script' | 'podcast_notes';
export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'blog';
export type ContentPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'medium' | 'substack' | 'blog';

export interface ContentFilters {
  status?: ContentStatus;
  content_type?: ContentType;
  platform?: Platform;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface CalendarEvent {
  id: string;
  title: string | null;
  date: Date;
  status: ContentStatus | Database['public']['Enums']['post_status'] | null;
  platforms: string[];
  content_type: ContentType | string;
}

export interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface ContentCalendarEvent {
  id: string;
  title: string;
  date: Date;
  status: ContentStatus;
  platforms: string[];
  content_type: ContentType;
}

export interface IdeaFilters {
  status?: 'new' | 'approved' | 'in_progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  search?: string;
}

export interface CreatePostInput {
  title: string;
  content?: string;
  content_type: string;
  platforms: ContentPlatform[];
  tags: string[];
  category?: string;
  slug?: string;
  meta_description?: string;
  scheduled_at?: string;
  status?: string;
}

// Utility functions
export function getContentTypeIcon(contentType: string | null | undefined): string {
  const icons: Record<string, string> = {
    post: '📝',
    article: '📄',
    thread: '🧵',
    newsletter: '📬',
    video_script: '🎬',
    podcast_notes: '🎙️',
    blog: '📰',
    social: '📱',
    video: '🎥',
    other: '📌',
  };
  return icons[contentType || ''] || '📝';
}

export function getContentTypeLabel(contentType: string | null | undefined): string {
  const labels: Record<string, string> = {
    post: 'Post',
    article: 'Article',
    thread: 'Thread',
    newsletter: 'Newsletter',
    video_script: 'Video Script',
    podcast_notes: 'Podcast Notes',
    blog: 'Blog',
    social: 'Social',
    video: 'Video',
    other: 'Other',
  };
  return labels[contentType || ''] || 'Post';
}

export function getStatusColor(status: string | null | undefined): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-yellow-100 text-yellow-700',
  };
  return colors[status || ''] || 'bg-gray-100 text-gray-700';
}

export function getStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    published: 'Published',
    archived: 'Archived',
  };
  return labels[status || ''] || 'Draft';
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitter: '𝕏',
    linkedin: 'in',
    facebook: 'f',
    instagram: '📸',
    youtube: '▶️',
    medium: 'M',
    substack: '📨',
    blog: '🌐',
    tiktok: '♪',
    threads: '🧵',
  };
  return icons[platform] || '🔗';
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    medium: 'Medium',
    substack: 'Substack',
    blog: 'Blog',
    tiktok: 'TikTok',
    threads: 'Threads',
  };
  return labels[platform] || platform;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
