# Task 05 — Microsoft Graph API Integration

## Goal

Build the server-side services that authenticate with Microsoft Graph using the signed-in user's token and list files from a specific SharePoint folder.

---

## Files to Create / Modify

- `services/graph/tokenProvider.ts`
- `services/graph/graphClient.ts`
- `services/graph/filesService.ts`
- `types/policy.ts` (Graph response types)

---

## Step-by-Step Tasks

### 1. Types — `types/policy.ts`

```typescript
// Raw shape returned by Microsoft Graph for a drive item (file)
export interface GraphDriveItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  eTag: string;
  webUrl: string;
  file?: {
    mimeType: string;
  };
  '@microsoft.graph.downloadUrl'?: string;
}

// Enriched policy file returned by /api/policies
export interface PolicyFile {
  id: string;                     // Supabase policy_documents.id (UUID)
  sharepointItemId: string;       // Graph driveItem.id
  name: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'other';
  lastModified: string;
  version: string;                // eTag
  acknowledged: boolean;
  acknowledgedAt: string | null;
}
```

### 2. Token provider — `services/graph/tokenProvider.ts`

Extracts the Graph-scoped access token from the NextAuth session. Called only in server contexts (API route handlers, RSC).

```typescript
import { auth } from '@/lib/auth';

export async function getGraphAccessToken(): Promise<string> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error('No Graph access token in session. User may not be authenticated.');
  }

  return session.accessToken;
}
```

### 3. Graph client factory — `services/graph/graphClient.ts`

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphAccessToken } from './tokenProvider';

export async function getGraphClient(): Promise<Client> {
  const accessToken = await getGraphAccessToken();

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
```

### 4. Files service — `services/graph/filesService.ts`

```typescript
import { env } from '@/lib/env';
import { getGraphClient } from './graphClient';
import type { GraphDriveItem } from '@/types/policy';

const { SHAREPOINT_SITE_ID, SHAREPOINT_DRIVE_ID, SHAREPOINT_FOLDER_ID } = env;

/**
 * Lists all files (not folders) inside the configured SharePoint folder.
 * Returns raw Graph driveItem objects.
 */
export async function listPoliciesFromSharePoint(): Promise<GraphDriveItem[]> {
  const client = await getGraphClient();

  const response = await client
    .api(
      `/sites/${SHAREPOINT_SITE_ID}/drives/${SHAREPOINT_DRIVE_ID}/items/${SHAREPOINT_FOLDER_ID}/children`
    )
    .select('id,name,file,size,lastModifiedDateTime,eTag,webUrl')
    .filter('file ne null')   // exclude sub-folders
    .get();

  return (response.value ?? []) as GraphDriveItem[];
}

/**
 * Returns a short-lived (≈1hr) pre-authenticated download URL for a file.
 * NEVER cache this URL — fetch fresh on every request.
 * NEVER expose this URL directly to the browser.
 */
export async function getFileDownloadUrl(itemId: string): Promise<string> {
  const client = await getGraphClient();

  const item = await client
    .api(
      `/sites/${SHAREPOINT_SITE_ID}/drives/${SHAREPOINT_DRIVE_ID}/items/${itemId}`
    )
    .select('id,name,file,@microsoft.graph.downloadUrl')
    .get();

  const downloadUrl = item['@microsoft.graph.downloadUrl'];

  if (!downloadUrl) {
    throw new Error(`No download URL returned for item ${itemId}`);
  }

  return downloadUrl as string;
}

/**
 * Returns the MIME type for a given SharePoint item.
 */
export async function getFileMimeType(itemId: string): Promise<string> {
  const client = await getGraphClient();

  const item = await client
    .api(
      `/sites/${SHAREPOINT_SITE_ID}/drives/${SHAREPOINT_DRIVE_ID}/items/${itemId}`
    )
    .select('file')
    .get();

  return (item.file?.mimeType as string) ?? 'application/octet-stream';
}
```

### 5. File type helper — `utils/fileUtils.ts`

```typescript
export type SupportedFileType = 'pdf' | 'docx' | 'pptx' | 'other';

const MIME_TO_TYPE: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

export function fileTypeFromMime(mimeType: string): SupportedFileType {
  return MIME_TO_TYPE[mimeType] ?? 'other';
}

export function fileTypeFromName(name: string): SupportedFileType {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'pptx') return 'pptx';
  return 'other';
}

export function isPreviewSupported(fileType: SupportedFileType): boolean {
  return fileType === 'pdf' || fileType === 'docx';
}
```

---

## Environment Variables Required

```bash
SHAREPOINT_SITE_ID=     # Get via: GET https://graph.microsoft.com/v1.0/sites?search=yoursite
SHAREPOINT_DRIVE_ID=    # Get via: GET https://graph.microsoft.com/v1.0/sites/{siteId}/drives
SHAREPOINT_FOLDER_ID=   # Get via: GET https://graph.microsoft.com/v1.0/sites/{siteId}/drives/{driveId}/root/children
```

### How to find these IDs (one-time setup)

Use [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) while signed in with an org admin account:

1. `GET https://graph.microsoft.com/v1.0/sites?search=policies` → copy `id` → `SHAREPOINT_SITE_ID`
2. `GET https://graph.microsoft.com/v1.0/sites/{siteId}/drives` → copy target drive `id` → `SHAREPOINT_DRIVE_ID`
3. `GET https://graph.microsoft.com/v1.0/sites/{siteId}/drives/{driveId}/root/children` → find the policies folder → copy `id` → `SHAREPOINT_FOLDER_ID`

---

## Critical Pitfalls

1. **`@microsoft.graph.downloadUrl` must be explicitly selected** — it is not returned in default Graph responses. Always add it to `.select()`
2. **Download URLs expire in ~1 hour** — never cache them. Fetch fresh on every `/api/policies/[id]` request
3. **Token expiry** — handled by the refresh logic in `lib/auth.ts`. If Graph returns 401, the session token needs refresh
4. **`filesService.ts` is server-only** — never import it in `'use client'` components. It reads from `auth()` which is server-only

---

## Acceptance Criteria

- [ ] `listPoliciesFromSharePoint()` returns an array of files from the configured SharePoint folder
- [ ] `getFileDownloadUrl()` returns a valid URL that can fetch the file content
- [ ] Calling either function without an authenticated session throws an error (not silently fails)
- [ ] No Graph API URLs or download URLs appear in browser network responses
- [ ] `fileTypeFromMime()` correctly maps MIME types to `'pdf' | 'docx' | 'pptx' | 'other'`
