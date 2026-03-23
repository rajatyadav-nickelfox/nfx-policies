import { env } from '@/lib/env';
import { getGraphClient } from './graphClient';
import type { GraphDriveItem } from '@/types/policy';

const SITE_ID = env.SHAREPOINT_SITE_ID;
const DRIVE_ID = env.SHAREPOINT_DRIVE_ID;
const FOLDER_ID = env.SHAREPOINT_FOLDER_ID;

export async function listPoliciesFromSharePoint(): Promise<GraphDriveItem[]> {
  const client = await getGraphClient();
  const response = await client
    .api(`/sites/${SITE_ID}/drives/${DRIVE_ID}/items/${FOLDER_ID}/children`)
    .select('id,name,file,size,lastModifiedDateTime,eTag,webUrl')
    .filter('file ne null')
    .get() as { value?: GraphDriveItem[] };
  return response.value ?? [];
}

export async function getFileDownloadUrl(itemId: string): Promise<string> {
  const client = await getGraphClient();
  const item = await client
    .api(`/sites/${SITE_ID}/drives/${DRIVE_ID}/items/${itemId}`)
    .select('id,name,file,@microsoft.graph.downloadUrl')
    .get() as GraphDriveItem;

  const downloadUrl = item['@microsoft.graph.downloadUrl'];
  if (!downloadUrl) throw new Error(`No download URL returned for item ${itemId}`);
  return downloadUrl;
}

export async function getFileMimeType(itemId: string): Promise<string> {
  const client = await getGraphClient();
  const item = await client
    .api(`/sites/${SITE_ID}/drives/${DRIVE_ID}/items/${itemId}`)
    .select('file')
    .get() as GraphDriveItem;
  return item.file?.mimeType ?? 'application/octet-stream';
}
