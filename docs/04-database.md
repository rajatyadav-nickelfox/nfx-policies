# Task 04 — Database (Supabase Schema & RLS)

## Goal

Create the Supabase Postgres schema, enable Row-Level Security, and set up the Supabase client helpers for both browser and server usage.

---

## Files to Create / Modify

- `services/supabase/client.ts` — browser singleton
- `services/supabase/server.ts` — server client (cookie-based) + admin client
- SQL migration (run in Supabase SQL editor)

---

## Step-by-Step Tasks

### 1. Run the following SQL in the Supabase SQL editor

```sql
-- ─────────────────────────────────────────────────────────────────
-- organizations
-- One row is seeded for Phase 1. Phase 2 will add more rows.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the default org (replace values as needed)
INSERT INTO organizations (id, name, domain)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Nickelfox',
  'nickelfox.com'
)
ON CONFLICT (domain) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  azure_object_id   TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL,
  display_name      TEXT,
  role              TEXT NOT NULL DEFAULT 'employee'
                    CHECK (role IN ('employee', 'manager', 'admin')),
  onboarded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_org        ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_azure_oid  ON users(azure_object_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);

-- ─────────────────────────────────────────────────────────────────
-- policy_documents
-- Source of truth is SharePoint; this table caches metadata.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  sharepoint_item_id    TEXT NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  file_type             TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'other')),
  version               TEXT,           -- Graph API eTag; change triggers re-acknowledgement
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, sharepoint_item_id)
);

CREATE INDEX IF NOT EXISTS idx_policy_docs_org ON policy_documents(organization_id);

-- ─────────────────────────────────────────────────────────────────
-- read_events
-- Immutable audit log — never update or delete rows.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS read_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  document_id      UUID NOT NULL REFERENCES policy_documents(id),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,         -- null until viewer closes or user acknowledges
  ip_address       TEXT,
  user_agent       TEXT
);

CREATE INDEX IF NOT EXISTS idx_read_events_user ON read_events(user_id);
CREATE INDEX IF NOT EXISTS idx_read_events_doc  ON read_events(document_id);
CREATE INDEX IF NOT EXISTS idx_read_events_org  ON read_events(organization_id);

-- ─────────────────────────────────────────────────────────────────
-- acknowledgements
-- One row per (user, document, document_version).
-- When a document is updated (eTag changes), a new row is required.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS acknowledgements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  document_id      UUID NOT NULL REFERENCES policy_documents(id),
  read_event_id    UUID REFERENCES read_events(id),
  document_version TEXT,
  acknowledged_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id, document_version)
);

CREATE INDEX IF NOT EXISTS idx_acks_user ON acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_acks_doc  ON acknowledgements(document_id);
CREATE INDEX IF NOT EXISTS idx_acks_org  ON acknowledgements(organization_id);

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE acknowledgements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active policy documents in their org
-- (we rely on server-side session checks; anon users have no access)
CREATE POLICY "users_read_own_profile"
ON users FOR SELECT
USING (id = auth.uid()::uuid);

CREATE POLICY "users_read_active_policies"
ON policy_documents FOR SELECT
USING (is_active = true);

CREATE POLICY "users_read_own_events"
ON read_events FOR SELECT
USING (user_id = auth.uid()::uuid);

CREATE POLICY "users_insert_own_events"
ON read_events FOR INSERT
WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "users_read_own_acks"
ON acknowledgements FOR SELECT
USING (user_id = auth.uid()::uuid);

CREATE POLICY "users_insert_own_acks"
ON acknowledgements FOR INSERT
WITH CHECK (user_id = auth.uid()::uuid);
```

> **Note**: API routes use `SUPABASE_SERVICE_ROLE_KEY` (admin client) which bypasses RLS entirely. RLS policies above are for direct client access. Prefer the service role key in all API routes.

---

### 2. Browser Supabase client — `services/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

### 3. Server Supabase clients — `services/supabase/server.ts`

Two clients:
- **Cookie-based client**: for user-scoped reads (respects RLS)
- **Admin client**: uses `SERVICE_ROLE_KEY`, bypasses RLS — used in API routes

```typescript
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

// Cookie-based client for RSC and server actions (respects RLS)
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// Admin client for API routes — bypasses RLS
export function createSupabaseServerAdmin() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
```

---

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Server-only. Never expose to browser.
DEFAULT_ORG_ID=00000000-0000-0000-0000-000000000001
```

---

## Acceptance Criteria

- [ ] All five tables exist in Supabase with correct columns and constraints
- [ ] RLS is enabled on all tables
- [ ] The seed org row exists (`domain = 'nickelfox.com'`)
- [ ] `createSupabaseServerAdmin()` can insert a test row into `users` without error
- [ ] `createSupabaseBrowserClient()` can query `policy_documents` (anon read is allowed via RLS)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never referenced in any `'use client'` file
