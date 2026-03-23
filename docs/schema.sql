-- organizations
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO organizations (id, name, domain)
VALUES ('00000000-0000-4000-8000-000000000001', 'Nickelfox', 'nickelfox.com')
ON CONFLICT (domain) DO NOTHING;

-- users
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

-- policy_documents
CREATE TABLE IF NOT EXISTS policy_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  sharepoint_item_id    TEXT NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  file_type             TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'other')),
  version               TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, sharepoint_item_id)
);

CREATE INDEX IF NOT EXISTS idx_policy_docs_org ON policy_documents(organization_id);

-- read_events
CREATE TABLE IF NOT EXISTS read_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  document_id      UUID NOT NULL REFERENCES policy_documents(id),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  ip_address       TEXT,
  user_agent       TEXT
);

CREATE INDEX IF NOT EXISTS idx_read_events_user ON read_events(user_id);
CREATE INDEX IF NOT EXISTS idx_read_events_doc  ON read_events(document_id);
CREATE INDEX IF NOT EXISTS idx_read_events_org  ON read_events(organization_id);

-- acknowledgements
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

-- RLS
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON users FOR SELECT USING (id = auth.uid()::uuid);
CREATE POLICY "users_read_active_policies" ON policy_documents FOR SELECT USING (is_active = true);
CREATE POLICY "users_read_own_events" ON read_events FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "users_insert_own_events" ON read_events FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "users_read_own_acks" ON acknowledgements FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "users_insert_own_acks" ON acknowledgements FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
