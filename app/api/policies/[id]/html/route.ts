export const runtime = 'nodejs';

import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import { getFileDownloadUrl } from '@/services/graph/filesService';
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
  if (doc.file_type !== 'docx') {
    return NextResponse.json({ error: 'Not a DOCX file' }, { status: 400 });
  }

  const downloadUrl = await getFileDownloadUrl(doc.sharepoint_item_id);
  const fileRes = await fetch(downloadUrl);
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  const { value: rawHtml } = await mammoth.convertToHtml({ buffer });

  const { window } = new JSDOM('');
  // jsdom's DOMWindow satisfies DOMPurify's WindowLike at runtime; types don't align perfectly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purify = DOMPurify(window as any);
  const html = purify.sanitize(rawHtml) as string;

  return NextResponse.json({ html });
}
