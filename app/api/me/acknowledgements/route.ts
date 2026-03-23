import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

export async function GET() {
  const { session, supabase, error } = await requireAuth();
  if (error) return error;

  const { data: userRow } = await supabase!
    .from('users')
    .select('id')
    .eq('azure_object_id', session!.user.azureOid)
    .single();

  if (!userRow) return new Response('User not found', { status: 404 });

  const { data: acks } = await supabase!
    .from('acknowledgements')
    .select('document_id, document_version, acknowledged_at')
    .eq('user_id', userRow.id);

  return NextResponse.json(acks ?? []);
}
