import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/apiAuth';

const schema = z.object({
  documentId: z.string().uuid(),
  readEventId: z.string().uuid(),
  documentVersion: z.string().min(1),
});

export async function POST(req: Request) {
  const { session, supabase, error } = await requireAuth();
  if (error) return error;

  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: userRow } = await supabase!
    .from('users')
    .select('id')
    .eq('azure_object_id', session!.user.azureOid)
    .single();

  if (!userRow) return new Response('User not found', { status: 404 });

  const { error: dbError } = await supabase!
    .from('acknowledgements')
    .insert({
      organization_id: process.env.DEFAULT_ORG_ID!,
      user_id: userRow.id,
      document_id: parsed.data.documentId,
      read_event_id: parsed.data.readEventId,
      document_version: parsed.data.documentVersion,
      acknowledged_at: new Date().toISOString(),
    });

  if (dbError) {
    if (dbError.code === '23505') {
      return NextResponse.json({ acknowledged: true }, { status: 200 });
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ acknowledged: true }, { status: 201 });
}
