// ============================================================================
// Solo Founder OS - Feedback Types
// Embeddable feedback widget system
// ============================================================================

export type FeedbackTheme = 'light' | 'dark' | 'auto';
export type FeedbackPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type FeedbackStatus = 'new' | 'in_review' | 'resolved' | 'archived';
export type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other';
export type EmojiRating = '😡' | '😕' | '😐' | '🙂' | '😍';

export interface FeedbackWidget {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  theme: FeedbackTheme;
  primary_color: string;
  position: FeedbackPosition;
  title: string;
  description: string;
  placeholder: string;
  success_message: string;
  allow_attachments: boolean;
  require_email: boolean;
  show_emoji_rating: boolean;
  categories: string[];
  is_active: boolean;
  allowed_domains: string[];
  created_at: string;
  updated_at: string;
}

export interface FeedbackSubmission {
  id: string;
  workspace_id: string;
  widget_id: string;
  email: string | null;
  name: string | null;
  message: string;
  category: FeedbackCategory;
  rating: number | null;
  emoji_rating: EmojiRating | null;
  attachment_urls: string[];
  page_url: string | null;
  user_agent: string | null;
  screen_size: string | null;
  contact_id: string | null;
  status: FeedbackStatus;
  internal_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface FeedbackSubmissionWithRelations extends FeedbackSubmission {
  widget?: FeedbackWidget;
  contact?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  assigned_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  responses?: FeedbackResponse[];
}

export interface FeedbackResponse {
  id: string;
  submission_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Input types
export interface CreateWidgetInput {
  name: string;
  slug: string;
  theme?: FeedbackTheme;
  primary_color?: string;
  position?: FeedbackPosition;
  title?: string;
  description?: string;
  placeholder?: string;
  success_message?: string;
  allow_attachments?: boolean;
  require_email?: boolean;
  show_emoji_rating?: boolean;
  categories?: string[];
  allowed_domains?: string[];
}

export interface UpdateWidgetInput extends Partial<CreateWidgetInput> {
  is_active?: boolean;
}

export interface CreateSubmissionInput {
  widget_id: string;
  message: string;
  email?: string;
  name?: string;
  category?: FeedbackCategory;
  rating?: number;
  emoji_rating?: EmojiRating;
  page_url?: string;
  user_agent?: string;
  screen_size?: string;
}

export interface UpdateSubmissionInput {
  status?: FeedbackStatus;
  internal_notes?: string;
  assigned_to?: string;
}

// Filter types
export interface FeedbackFilters {
  status?: FeedbackStatus | FeedbackStatus[];
  category?: FeedbackCategory | FeedbackCategory[];
  widget_id?: string;
  has_email?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Stats types
export interface FeedbackStats {
  total: number;
  new_count: number;
  in_review_count: number;
  resolved_count: number;
  avg_rating: number | null;
  bug_count: number;
  feature_count: number;
  question_count: number;
  submissions_today: number;
  submissions_this_week: number;
}

// Utility functions
export function getStatusColor(status: FeedbackStatus): string {
  const colors: Record<FeedbackStatus, string> = {
    new: 'bg-blue-500',
    in_review: 'bg-amber-500',
    resolved: 'bg-green-500',
    archived: 'bg-gray-500',
  };
  return colors[status];
}

export function getStatusLabel(status: FeedbackStatus): string {
  const labels: Record<FeedbackStatus, string> = {
    new: 'New',
    in_review: 'In Review',
    resolved: 'Resolved',
    archived: 'Archived',
  };
  return labels[status];
}

export function getCategoryIcon(category: FeedbackCategory): string {
  const icons: Record<FeedbackCategory, string> = {
    bug: '🐛',
    feature: '✨',
    question: '❓',
    other: '💬',
  };
  return icons[category];
}

export function getCategoryLabel(category: FeedbackCategory): string {
  const labels: Record<FeedbackCategory, string> = {
    bug: 'Bug Report',
    feature: 'Feature Request',
    question: 'Question',
    other: 'Other',
  };
  return labels[category];
}

export function getEmojiValue(emoji: EmojiRating): number {
  const values: Record<EmojiRating, number> = {
    '😡': 1,
    '😕': 2,
    '😐': 3,
    '🙂': 4,
    '😍': 5,
  };
  return values[emoji];
}

export function getEmojiFromValue(value: number): EmojiRating {
  const emojis: Record<number, EmojiRating> = {
    1: '😡',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😍',
  };
  return emojis[value] || '😐';
}

export function generateWidgetSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

export function getWidgetEmbedCode(widgetId: string, baseUrl: string): string {
  return `<script src="${baseUrl}/embed/feedback.js" data-widget-id="${widgetId}" async></script>`;
}
