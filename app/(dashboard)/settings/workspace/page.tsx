import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Legacy redirect: /settings/workspace was the old surface for workspace
 * configuration. Workspace-scoped settings now live at
 * /workspaces/[id]/settings, reachable from the WorkspaceSwitcher in the
 * sidebar. This page preserves any bookmarked URLs by resolving the user's
 * most-recent workspace membership server-side and 308-redirecting there.
 *
 * Edge cases:
 *  - No auth: bounce to /login
 *  - Auth but zero memberships: bounce to /workspaces (which offers create)
 *  - Auth with memberships: redirect to the most-recently-joined workspace's
 *    settings page. The active-workspace selector (sidebar switcher) can
 *    move the user to a different workspace afterward.
 */
export default async function LegacySettingsWorkspaceRedirect() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    redirect('/workspaces');
  }

  redirect(`/workspaces/${membership.workspace_id}/settings`);
}
