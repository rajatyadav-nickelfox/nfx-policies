# Task 06 — API Route Handlers

## Goal

Implement all Next.js API route handlers. These are the only server-side entry points that interact with SharePoint, Supabase, and the file proxy. All routes require authentication.

---

## Files to Create

- `app/api/policies/route.ts`
- `app/api/policies/[id]/route.ts`
- `app/api/policies/[id]/html/route.ts`
- `app/api/read-events/route.ts`
- `app/api/acknowledgements/route.ts`
- `app/api/me/acknowledgements/route.ts`

---

## Shared Auth Guard Helper

Create a small helper to reduce boilerplate in every route:

```typescript
// lib/apiAuth.ts
import { auth } from '@/lib/auth';
import { createSupabaseServerAdmin } from '@/services/supabase/server';

export async function requireAuth() {
  const session = await auth();
  if (!session?.accessToken) {
    return { session: null, supabase: null, error: new Response('Unauthorized', { status: 401 }) };
  }
  const supabase = createSupabaseServerAdmin();
  return { session, supabase, error: null };
}
```

---

## Route 1: List policies — `app/api/policies/route.ts`

**GET /api/policies**

Logic:
1. Authenticate
2. List files from SharePoint via `listPoliciesFromSharePoint()`
3. Upsert any new files into Supabase `policy_documents`
4. Fetch the current user's `acknowledgements`
5. Merge and return `PolicyFile[]`

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import { listPoliciesFromSharePoint } from '@/services/graph/filesService';
import { fileTypeFromMime, fileTypeFromName } from '@/utils/fileUtils';
import { env } from '@/lib/env';

export async function GET() {
  const { session, supabase, error } = await requireAuth();
  if (error) return error;

  // 1. Fetch files from SharePoint
  const graphItems = await listPoliciesFromSharePoint();

  // 2. Upsert new/changed files into policy_documents
  if (graphItems.length > 0) {
    const upsertRows = graphItems.map((item) => ({
      organization_id: env.DEFAULT_ORG_ID,
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

  // 3. Fetch Supabase records (now upserted)
  const { data: docs } = await supabase!
    .from('policy_documents')
    .select('id, sharepoint_item_id, name, file_type, version, is_active')
    .eq('organization_id', env.DEFAULT_ORG_ID)
    .eq('is_active', true);

  if (!docs) return NextResponse.json([]);

  // 4. Fetch user's acknowledgements
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
    (acks ?? []).map((a) => [`${a.document_id}_${a.document_version}`, a])
  );

  // 5. Merge and return
  const result = docs.map((doc) => {
    const ack = ackMap.get(`${doc.id}_${doc.version}`);
    return {
      id: doc.id,
      sharepointItemId: doc.sharepoint_item_id,
      name: doc.name,
      fileType: doc.file_type,
      version: doc.version,
      acknowledged: !!ack,
      acknowledgedAt: ack?.acknowledged_at ?? null,
    };
  });

  return NextResponse.json(result);
}
```

---

## Route 2: File proxy (PDF) — `app/api/policies/[id]/route.ts`

**GET /api/policies/[id]**

Proxies the file from SharePoint to the browser with `Content-Disposition: inline`. Never exposes the Graph download URL. Prevents browser download.

```typescript
import { requireAuth } from '@/lib/apiAuth';
import { getFileDownloadUrl, getFileMimeType } from '@/services/graph/filesService';
import { createSupabaseServerAdmin } from '@/services/supabase/server';
import { env } from '@/lib/env';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await requireAuth();
  if (error) return error;

  // Look up the SharePoint item ID from Supabase
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

  // Proxy stream — download URL never reaches the browser
  const upstream = await fetch(downloadUrl);

  if (!upstream.ok) {
    return new Response('Failed to fetch file from SharePoint', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': 'inline',             // render in browser, not download
      'Cache-Control': 'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

---

## Route 3: DOCX → HTML — `app/api/policies/[id]/html/route.ts`

**GET /api/policies/[id]/html**

Converts a Word document to sanitized HTML server-side. Must run on Node.js runtime (not Edge).

```typescript
// mammoth is not Edge-compatible
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

  // Sanitize with DOMPurify (server-side via jsdom)
  const { window } = new JSDOM('');
  const purify = DOMPurify(window as unknown as Window);
  const html = purify.sanitize(rawHtml);

  return NextResponse.json({ html });
}
```

> **Note**: Install `jsdom` for server-side DOMPurify: `npm install jsdom @types/jsdom`

---

## Route 4: Log read event — `app/api/read-events/route.ts`

**POST /api/read-events**

Called when a user opens a document viewer.

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/apiAuth';
import { env } from '@/lib/env';

const schema = z.object({
  documentId: z.string().uuid(),
});

export async function POST(req: Request) {
  const { session, supabase, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Look up internal user ID
  const { data: userRow } = await supabase!
    .from('users')
    .select('id')
    .eq('azure_object_id', session!.user.azureOid)
    .single();

  if (!userRow) return new Response('User not found', { status: 404 });

  const { data, error: dbError } = await supabase!
    .from('read_events')
    .insert({
      organization_id: env.DEFAULT_ORG_ID,
      user_id: userRow.id,
      document_id: parsed.data.documentId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ readEventId: data.id }, { status: 201 });
}
```

---

## Route 5: Submit acknowledgement — `app/api/acknowledgements/route.ts`

**POST /api/acknowledgements**

Called when a user clicks "I have read this document".

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/apiAuth';
import { env } from '@/lib/env';

const schema = z.object({
  documentId: z.string().uuid(),
  readEventId: z.string().uuid(),
  documentVersion: z.string().min(1),
});

export async function POST(req: Request) {
  const { session, supabase, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
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
      organization_id: env.DEFAULT_ORG_ID,
      user_id: userRow.id,
      document_id: parsed.data.documentId,
      read_event_id: parsed.data.readEventId,
      document_version: parsed.data.documentVersion,
      acknowledged_at: new Date().toISOString(),
    });

  if (dbError) {
    // Duplicate ack (user already acknowledged this version) — treat as success
    if (dbError.code === '23505') {
      return NextResponse.json({ acknowledged: true }, { status: 200 });
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ acknowledged: true }, { status: 201 });
}
```

---

## Route 6: Get my acknowledgements — `app/api/me/acknowledgements/route.ts`

**GET /api/me/acknowledgements**

```typescript
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
```

---

## Acceptance Criteria

- [ ] `GET /api/policies` returns a JSON array of `PolicyFile` objects with `acknowledged: boolean`
- [ ] `GET /api/policies/[id]` proxies a PDF with `Content-Disposition: inline` and no raw Graph URL in response
- [ ] `GET /api/policies/[id]/html` returns `{ html: string }` for a DOCX file; fails gracefully for non-DOCX
- [ ] `POST /api/read-events` inserts a row in `read_events` and returns `{ readEventId }`
- [ ] `POST /api/acknowledgements` inserts a row in `acknowledgements`; duplicate calls return 200 (not 500)
- [ ] All routes return 401 when called without a valid session
- [ ] Zod validation on POST routes returns 400 with error details for malformed payloads
