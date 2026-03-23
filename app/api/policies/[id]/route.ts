import { requireAuth } from '@/lib/apiAuth';
import { getFileDownloadUrl, getFileMimeType } from '@/services/graph/filesService';
import { createSupabaseServerAdmin } from '@/services/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireAuth();
  if (error) return error;

  const supabase = createSupabaseServerAdmin();
  const { data: doc } = await supabase
    .from('policy_documents')
    .select('sharepoint_item_id, file_type')
    .eq('id', id)
    .single();

  if (!doc) return new Response('Not found', { status: 404 });

  const [downloadUrl, mimeType] = await Promise.all([
    getFileDownloadUrl(doc.sharepoint_item_id),
    getFileMimeType(doc.sharepoint_item_id),
  ]);

  const upstream = await fetch(downloadUrl);
  if (!upstream.ok) {
    return new Response('Failed to fetch file from SharePoint', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
