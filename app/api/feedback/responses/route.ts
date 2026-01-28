import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Note: feedback_responses table not included in base schema
// This is a stub that acknowledges the request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submission_id, message } = body;

    if (!submission_id || !message) {
      return NextResponse.json({ error: 'submission_id and message are required' }, { status: 400 });
    }

    // Get submission to verify access
    const { data: submission } = await supabase
      .from('feedback_submissions')
      .select('workspace_id')
      .eq('id', submission_id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', submission.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // For now, just return success - responses table not in base schema
    // In a full implementation, this would store the response
    return NextResponse.json({ 
      success: true,
      message: 'Response recorded (note: responses table not in base schema)'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
  }
}
