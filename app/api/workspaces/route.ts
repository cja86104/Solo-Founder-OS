import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_PERMISSIONS,
  generateSlug,
} from '@/types/workspace';
import type { Database, Json } from '@/types/database';

// ============================================================================
// POST /api/workspaces - Create a workspace + owner membership.
//
// Authorization fields (`owner_id`, `role`, `permissions`) are derived
// server-side from the authenticated session — they are NEVER taken from the
// request body. This prevents the client from claiming ownership of another
// user, granting itself roles it shouldn't have, or escalating permissions.
// ============================================================================

type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];
type WorkspaceMemberInsert = Database['public']['Tables']['workspace_members']['Insert'];

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers, and hyphens only')
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name } = parsed.data;
    const slug = parsed.data.slug ?? generateSlug(name);

    if (!slug) {
      return NextResponse.json(
        { error: 'Could not derive a valid slug from the provided name' },
        { status: 400 }
      );
    }

    // 3. Check slug availability
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This workspace URL is already taken' },
        { status: 409 }
      );
    }

    // 4. Create workspace — owner_id is server-derived from session
    const workspaceInsert: WorkspaceInsert = {
      name,
      slug,
      owner_id: user.id,
    };

    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert(workspaceInsert)
      .select()
      .single();

    if (createError || !newWorkspace) {
      console.error('Error creating workspace:', createError);
      return NextResponse.json(
        { error: createError?.message || 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // 5. Create owner membership — role + permissions are server-controlled
    const memberInsert: WorkspaceMemberInsert = {
      workspace_id: newWorkspace.id,
      user_id: user.id,
      role: 'owner',
      permissions: DEFAULT_PERMISSIONS as unknown as Json,
    };

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert(memberInsert);

    if (memberError) {
      // Best-effort rollback to avoid an orphan workspace if membership fails.
      // If the workspace delete also fails, the orphan will be surfaced to the
      // caller via the original error.
      console.error('Error creating workspace membership:', memberError);
      await supabase.from('workspaces').delete().eq('id', newWorkspace.id);
      return NextResponse.json(
        { error: 'Failed to create workspace membership' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        workspace: newWorkspace,
        role: 'owner' as const,
        permissions: DEFAULT_PERMISSIONS,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
