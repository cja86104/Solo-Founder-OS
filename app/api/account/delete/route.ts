import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// =============================================================================
// DELETE /api/account/delete — Permanently delete the authenticated user
// =============================================================================

export async function DELETE() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to delete from auth.users — this cascades to all
    // tables with ON DELETE CASCADE (profiles, subscriptions, workspace_members, etc.)
    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account', detail: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
