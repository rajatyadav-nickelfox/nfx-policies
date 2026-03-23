import { env } from '@/lib/env';
import { getGraphClient } from './graphClient';
import type { GraphDriveItem } from '@/types/policy';

function encodeShareUrl(url: string): string {
  return `u!${Buffer.from(url).toString('base64url')}`;
}

let resolvedFolder: { driveId: string; itemId: string } | null = null;

async function getResolvedFolder(): Promise<{ driveId: string; itemId: string }> {
  if (resolvedFolder) return resolvedFolder;
  const client = await getGraphClient();
  const shareId = encodeShareUrl(env.SHAREPOINT_FOLDER_URL);
  const item = await client
    .api(`/shares/${shareId}/driveItem`)
    .select('id,parentReference')
    .get() as { id: string; parentReference: { driveId: string } };
  resolvedFolder = { driveId: item.parentReference.driveId, itemId: item.id };
  return resolvedFolder;
}

export async function listPoliciesFromSharePoint(): Promise<GraphDriveItem[]> {
  const client = await getGraphClient();
  const shareId = encodeShareUrl(env.SHAREPOINT_FOLDER_URL);
  const response = await client
    .api(`/shares/${shareId}/driveItem/children`)
    .select('id,name,file,size,lastModifiedDateTime,eTag,webUrl')
    .filter('file ne null')
    .get() as { value?: GraphDriveItem[] };
  return response.value ?? [];
}

export async function getFileDownloadUrl(itemId: string): Promise<string> {
  const { driveId } = await getResolvedFolder();
  const client = await getGraphClient();
  const item = await client
    .api(`/drives/${driveId}/items/${itemId}`)
    .select('id,name,file,@microsoft.graph.downloadUrl')
    .get() as GraphDriveItem;

  const downloadUrl = item['@microsoft.graph.downloadUrl'];
  if (!downloadUrl) throw new Error(`No download URL returned for item ${itemId}`);
  return downloadUrl;
}

export async function getFileMimeType(itemId: string): Promise<string> {
  const { driveId } = await getResolvedFolder();
  const client = await getGraphClient();
  const item = await client
    .api(`/drives/${driveId}/items/${itemId}`)
    .select('file')
    .get() as GraphDriveItem;
  return item.file?.mimeType ?? 'application/octet-stream';
}
