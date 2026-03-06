/**
 * Type-safe Supabase client wrapper
 *
 * This module provides properly typed access to Supabase tables,
 * working around TypeScript inference issues with the generated types.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Re-export table types for convenience
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

// Type helpers for table operations
export type TableRow<T extends TableName> = Tables[T]['Row'];
export type TableInsert<T extends TableName> = Tables[T]['Insert'];
export type TableUpdate<T extends TableName> = Tables[T]['Update'];

// Typed client type
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Get a typed table accessor
 * Use this instead of directly calling supabase.from() when you need type safety
 */
export function getTable<T extends TableName>(
  supabase: TypedSupabaseClient,
  tableName: T
) {
  // The cast is safe because we're constraining to known table names
  return supabase.from(tableName);
}

// Helper types for common query patterns
export type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

export type QueryArrayResult<T> = {
  data: T[] | null;
  error: Error | null;
  count?: number | null;
};
