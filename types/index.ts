// Re-export database types
export * from "./database";

// User with profile
export interface UserWithProfile {
  id: string;
  email: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    role: "user" | "admin";
  } | null;
  subscription: {
    plan: "trial" | "expired" | "pro" | "lifetime";
    status: string;
  } | null;
}

// Navigation item
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[];
}

// Breadcrumb item
export interface BreadcrumbItem {
  title: string;
  href?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Sort
export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

// Filter
export interface FilterParams {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in";
  value: string | number | boolean | string[] | number[];
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Action State (for useActionState)
export interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

// Toast notification
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

// Modal/Dialog state
export interface ModalState<T = unknown> {
  isOpen: boolean;
  data?: T;
}

// Form field error
export interface FieldError {
  field: string;
  message: string;
}

// Date range
export interface DateRange {
  from: Date;
  to: Date;
}

// Chart data point
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Metric card data
export interface MetricData {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
}

// Activity feed item
export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

// Command palette item
export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string[];
  action: () => void;
  group?: string;
}

// File upload
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

// Search result
export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
}
