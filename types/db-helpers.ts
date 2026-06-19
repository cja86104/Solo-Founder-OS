/**
 * Convenience generics over the generated Supabase Database type.
 *
 * These let route handlers cast validated request bodies to the exact
 * Insert/Update shape Supabase expects, without restating the long-form
 * Database['public']['Tables']['name']['Insert'] path everywhere.
 *
 * Lives in its own file so it survives regeneration of types/database.ts.
 *
 *   import type { TablesUpdate } from '@/types/db-helpers';
 *   const data: TablesUpdate<'deals'> = { name: 'New name' };
 */
import type { Database } from '@/types/database';

export type TableName = keyof Database['public']['Tables'];

export type Tables<T extends TableName> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends TableName> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends TableName> =
  Database['public']['Tables'][T]['Update'];
