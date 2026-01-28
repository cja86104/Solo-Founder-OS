// Vault item types
export type VaultItemType = "snippet" | "prompt" | "component" | "template" | "note";

export interface VaultItem {
  id: string;
  user_id: string;
  collection_id: string | null;
  title: string;
  description: string | null;
  content: string;
  type: VaultItemType | null;
  language: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  is_public: boolean | null;
  use_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at?: string | null;
  workspace_id?: string;
}

export interface VaultCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_public: boolean | null;
  item_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  workspace_id?: string;
}

export interface VaultItemWithCollection extends VaultItem {
  collection: VaultCollection | null;
}

// Form inputs
export interface CreateVaultItemInput {
  title: string;
  description?: string;
  content: string;
  type: VaultItemType;
  language?: string;
  tags?: string[];
  collection_id?: string;
  is_public?: boolean;
}

export interface UpdateVaultItemInput extends Partial<CreateVaultItemInput> {
  is_favorite?: boolean;
}

export interface CreateVaultCollectionInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_public?: boolean;
}

export interface UpdateVaultCollectionInput extends Partial<CreateVaultCollectionInput> {}

// Filter/search params
export interface VaultFilters {
  type?: VaultItemType;
  language?: string;
  collection_id?: string;
  is_favorite?: boolean;
  tags?: string[];
  search?: string;
}

// Language options for code snippets
export const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "powershell", label: "PowerShell" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "graphql", label: "GraphQL" },
  { value: "prisma", label: "Prisma" },
  { value: "other", label: "Other" },
] as const;

export const ITEM_TYPES = [
  { value: "snippet", label: "Code Snippet", icon: "Code2" },
  { value: "prompt", label: "AI Prompt", icon: "Sparkles" },
  { value: "component", label: "Component", icon: "Component" },
  { value: "template", label: "Template", icon: "FileText" },
  { value: "note", label: "Note", icon: "StickyNote" },
] as const;

export const COLLECTION_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
] as const;
