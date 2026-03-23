import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import { listPoliciesFromSharePoint } from '@/services/graph/filesService';
import { fileTypeFromMime, fileTypeFromName } from '@/utils/fileUtils';

export async function GET() {
  const { session, supabase, error } = await requireAuth();
  if (error) return error;

  const graphItems = await listPoliciesFromSharePoint();

  if (graphItems.length > 0) {
    const upsertRows = graphItems.map((item) => ({
      organization_id: process.env.DEFAULT_ORG_ID!,
      sharepoint_item_id: item.id,
      name: item.name,
      file_type: item.file?.mimeType
        ? fileTypeFromMime(item.file.mimeType)
        : fileTypeFromName(item.name),
      version: item.eTag,
      is_active: true,
    }));

    await supabase!
      .from('policy_documents')
      .upsert(upsertRows, { onConflict: 'organization_id,sharepoint_item_id' });
  }

  const { data: docs } = await supabase!
    .from('policy_documents')
    .select('id, sharepoint_item_id, name, file_type, version, is_active')
    .eq('organization_id', process.env.DEFAULT_ORG_ID!)
    .eq('is_active', true);

  if (!docs) return NextResponse.json([]);

  const { data: userRow } = await supabase!
    .from('users')
    .select('id')
    .eq('azure_object_id', session!.user.azureOid)
    .single();

  const { data: acks } = userRow
    ? await supabase!
        .from('acknowledgements')
        .select('document_id, document_version, acknowledged_at')
        .eq('user_id', userRow.id)
    : { data: [] };

  const ackMap = new Map(
    (acks ?? []).map((a: { document_id: string; document_version: string; acknowledged_at: string }) => [
      `${a.document_id}_${a.document_version}`,
      a,
    ])
  );

  const result = docs.map((doc: { id: string; sharepoint_item_id: string; name: string; file_type: string; version: string }) => {
    const ack = ackMap.get(`${doc.id}_${doc.version}`);
    return {
      id: doc.id,
      sharepointItemId: doc.sharepoint_item_id,
      name: doc.name,
      fileType: doc.file_type,
      version: doc.version,
      acknowledged: !!ack,
      acknowledgedAt: (ack as { acknowledged_at?: string } | undefined)?.acknowledged_at ?? null,
    };
  });

  return NextResponse.json(result);
}
