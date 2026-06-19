/**
 * Validate that a value (typically a querystring, JSON body field, or any
 * external string) matches one of the allowed enum values, and return the
 * value strongly typed as the matching literal-union member.
 *
 * Returns null when the value is missing or does not match — callers are
 * expected to treat null as "this filter / parameter was not supplied",
 * which mirrors how a missing querystring param would be handled.
 *
 * Usage:
 *   import { Constants } from '@/types/database';
 *   const status = parseEnum(
 *     searchParams.get('status'),
 *     Constants.public.Enums.deal_status,
 *   );
 *   // status is now `'open' | 'won' | 'lost' | null`
 *
 * Pair with the `Constants.public.Enums.<name>` runtime arrays exported from
 * the generated Supabase types — that guarantees the validator and the DB
 * schema can never drift.
 */
export function parseEnum<const T extends readonly string[]>(
  value: string | null | undefined,
  allowed: T,
): T[number] | null {
  if (value === null || value === undefined || value === '') return null;
  return (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : null;
}
