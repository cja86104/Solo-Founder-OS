import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// =============================================================================
// POST /api/content/upload — Upload media files for content posts
// Uses admin client to bypass storage RLS policies
// =============================================================================

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const BUCKET = 'content-media';

export async function POST(request: NextRequest) {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspace_id') as string | null;

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: 'file and workspace_id are required' },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await (supabase
      .from('workspace_members') as any)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate file type and size
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use JPG, PNG, GIF, WebP, MP4, or WebM.' },
        { status: 400 }
      );
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image must be less than 10MB' }, { status: 400 });
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'Video must be less than 50MB' }, { status: 400 });
    }

    // Use admin client to bypass storage RLS
    const adminClient = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await adminClient.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.id === BUCKET);
    if (!bucketExists) {
      await adminClient.storage.createBucket(BUCKET, { public: true });
    }

    // Upload file
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uuid = crypto.randomUUID();
    const filePath = `${workspaceId}/${uuid}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = adminClient.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      type: isImage ? 'image' : 'video',
      name: file.name,
    });
  } catch (error) {
    console.error('Content upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
