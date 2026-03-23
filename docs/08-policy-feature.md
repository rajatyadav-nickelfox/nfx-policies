# Task 08 — Policy Feature Components

## Goal

Build the full policy document feature: the list page, individual policy cards with read/unread badges, the document viewer (PDF and DOCX branches), and the acknowledgement banner.

**Prerequisite**: Complete tasks 07 (UI components) and 09 (state & queries) first.

---

## Files to Create

- `features/policies/validators/policySchema.ts`
- `features/policies/components/ReadBadge.tsx`
- `features/policies/components/PolicyCard.tsx`
- `features/policies/components/PolicyList.tsx`
- `features/policies/components/PdfViewer.tsx`
- `features/policies/components/DocxViewer.tsx`
- `features/policies/components/AcknowledgementBanner.tsx`
- `features/policies/components/PolicyViewer.tsx`
- `app/(dashboard)/policies/page.tsx`
- `app/(dashboard)/policies/[id]/page.tsx`

---

## Step-by-Step Tasks

### 1. Zod validators — `features/policies/validators/policySchema.ts`

```typescript
import { z } from 'zod';

export const policyFileSchema = z.object({
  id: z.string().uuid(),
  sharepointItemId: z.string().min(1),
  name: z.string().min(1),
  fileType: z.enum(['pdf', 'docx', 'pptx', 'other']),
  version: z.string(),
  acknowledged: z.boolean(),
  acknowledgedAt: z.string().nullable(),
});

export type PolicyFile = z.infer<typeof policyFileSchema>;
```

### 2. ReadBadge — `features/policies/components/ReadBadge.tsx`

```typescript
import { Badge } from '@/components/ui/Badge';

interface ReadBadgeProps {
  acknowledged: boolean;
}

export function ReadBadge({ acknowledged }: ReadBadgeProps) {
  return (
    <Badge
      variant={acknowledged ? 'read' : 'unread'}
      label={acknowledged ? 'Read' : 'Unread'}
    />
  );
}
```

### 3. PolicyCard — `features/policies/components/PolicyCard.tsx`

```typescript
import { Card } from '@/components/ui/Card';
import { ReadBadge } from './ReadBadge';
import type { PolicyFile } from '@/types/policy';

interface PolicyCardProps {
  policy: PolicyFile;
  onClick: (policy: PolicyFile) => void;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  pptx: 'PowerPoint',
  other: 'Document',
};

export function PolicyCard({ policy, onClick }: PolicyCardProps) {
  return (
    <Card onClick={() => onClick(policy)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{policy.name}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {FILE_TYPE_LABELS[policy.fileType] ?? 'Document'}
          </p>
        </div>
        <ReadBadge acknowledged={policy.acknowledged} />
      </div>
      {policy.acknowledgedAt && (
        <p className="mt-3 text-xs text-text-secondary">
          Acknowledged on {new Date(policy.acknowledgedAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
```

### 4. PolicyList — `features/policies/components/PolicyList.tsx`

```typescript
'use client';

import { usePolicies } from '../hooks/usePolicies';
import { usePolicyStore } from '../store/policyStore';
import { PolicyCard } from './PolicyCard';
import { PolicyViewer } from './PolicyViewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PolicyFile } from '@/types/policy';

export function PolicyList() {
  const { data: policies, isLoading, error } = usePolicies();
  const { openViewer } = usePolicyStore();

  function handleCardClick(policy: PolicyFile) {
    openViewer(policy.id, policy.name);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load policies"
        description="There was a problem fetching documents. Please refresh the page."
      />
    );
  }

  if (!policies || policies.length === 0) {
    return (
      <EmptyState
        title="No policies found"
        description="No policy documents have been added to the shared folder yet."
      />
    );
  }

  const unread = policies.filter((p) => !p.acknowledged);
  const read = policies.filter((p) => p.acknowledged);

  return (
    <>
      <div className="space-y-8">
        {unread.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Requires your attention ({unread.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unread.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} onClick={handleCardClick} />
              ))}
            </div>
          </section>
        )}
        {read.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Completed ({read.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {read.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} onClick={handleCardClick} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Document viewer modal — rendered outside the grid */}
      <PolicyViewer />
    </>
  );
}
```

### 5. PdfViewer — `features/policies/components/PdfViewer.tsx`

```typescript
'use client';

import { Worker, Viewer } from '@react-pdf-viewer/core';
import { toolbarPlugin, type ToolbarSlot } from '@react-pdf-viewer/toolbar';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

interface PdfViewerProps {
  documentId: string;
}

export function PdfViewer({ documentId }: PdfViewerProps) {
  const toolbarPluginInstance = toolbarPlugin();
  const { renderDefaultToolbar, Toolbar } = toolbarPluginInstance;

  // Remove download, print, and open file buttons from the toolbar
  const transform = (slot: ToolbarSlot) => ({
    ...slot,
    Download: () => null,
    DownloadMenuItem: () => null,
    Print: () => null,
    PrintMenuItem: () => null,
    Open: () => null,
    OpenMenuItem: () => null,
  });

  return (
    <div className="h-full w-full overflow-hidden rounded-[var(--radius-md)] border border-border">
      <Worker workerUrl="/pdf.worker.min.js">
        <div className="flex h-full flex-col">
          <div className="border-b border-border bg-surface px-2 py-1">
            <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
          </div>
          <div className="flex-1 overflow-hidden">
            <Viewer
              fileUrl={`/api/policies/${documentId}`}
              plugins={[toolbarPluginInstance]}
            />
          </div>
        </div>
      </Worker>
    </div>
  );
}
```

### 6. DocxViewer — `features/policies/components/DocxViewer.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DocxViewerProps {
  documentId: string;
}

export function DocxViewer({ documentId }: DocxViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetch(`/api/policies/${documentId}/html`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load document');
        return res.json();
      })
      .then((data: { html: string }) => setHtml(data.html))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [documentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-text-primary">Preview unavailable</p>
        <p className="mt-1 text-xs text-text-secondary">
          This document format cannot be previewed. Please contact IT support.
        </p>
      </div>
    );
  }

  return (
    <div
      className="policy-docx-body mx-auto max-w-3xl px-8 py-6"
      onContextMenu={(e) => e.preventDefault()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

### 7. AcknowledgementBanner — `features/policies/components/AcknowledgementBanner.tsx`

```typescript
'use client';

import { Button } from '@/components/ui/Button';

interface AcknowledgementBannerProps {
  acknowledged: boolean;
  isLoading: boolean;
  onAcknowledge: () => void;
}

export function AcknowledgementBanner({
  acknowledged,
  isLoading,
  onAcknowledge,
}: AcknowledgementBannerProps) {
  if (acknowledged) {
    return (
      <div className="flex items-center gap-2 border-t border-border bg-accent-light px-6 py-4">
        <span className="text-sm font-medium text-status-read">
          ✓ You have acknowledged this document
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-border bg-surface px-6 py-4">
      <p className="text-sm text-text-secondary">
        Please read the full document before acknowledging.
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={onAcknowledge}
        isLoading={isLoading}
        disabled={isLoading}
      >
        I have read this document
      </Button>
    </div>
  );
}
```

### 8. PolicyViewer — `features/policies/components/PolicyViewer.tsx`

The orchestrator component. Reads from the Zustand store to know which document is open, branches to PdfViewer or DocxViewer, and renders the AcknowledgementBanner.

```typescript
'use client';

import { usePolicyStore } from '../store/policyStore';
import { usePolicies } from '../hooks/usePolicies';
import { usePolicyViewer } from '../hooks/usePolicyViewer';
import { Modal } from '@/components/ui/Modal';
import { PdfViewer } from './PdfViewer';
import { DocxViewer } from './DocxViewer';
import { AcknowledgementBanner } from './AcknowledgementBanner';
import { isPreviewSupported } from '@/utils/fileUtils';

export function PolicyViewer() {
  const { openDocumentId, openDocumentName, closeViewer } = usePolicyStore();
  const { data: policies } = usePolicies();

  const currentPolicy = policies?.find((p) => p.id === openDocumentId) ?? null;

  const { isAcknowledging, hasAcknowledged, handleAcknowledge } = usePolicyViewer(
    openDocumentId,
    currentPolicy?.version ?? null
  );

  const isAcknowledged = hasAcknowledged || (currentPolicy?.acknowledged ?? false);

  if (!openDocumentId || !currentPolicy) return null;

  const canPreview = isPreviewSupported(currentPolicy.fileType);

  return (
    <Modal
      isOpen={!!openDocumentId}
      onClose={closeViewer}
      title={openDocumentName ?? 'Document'}
      size="full"
    >
      <div className="flex h-full flex-col">
        {/* Document viewer area */}
        <div className="flex-1 overflow-auto">
          {!canPreview ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-text-primary">Preview not available</p>
              <p className="mt-1 text-xs text-text-secondary">
                This file type ({currentPolicy.fileType}) cannot be previewed in the browser.
              </p>
            </div>
          ) : currentPolicy.fileType === 'pdf' ? (
            <PdfViewer documentId={openDocumentId} />
          ) : (
            <DocxViewer documentId={openDocumentId} />
          )}
        </div>

        {/* Acknowledgement banner pinned to bottom */}
        <AcknowledgementBanner
          acknowledged={isAcknowledged}
          isLoading={isAcknowledging}
          onAcknowledge={handleAcknowledge}
        />
      </div>
    </Modal>
  );
}
```

### 9. Policies list page — `app/(dashboard)/policies/page.tsx`

```typescript
import { PolicyList } from '@/features/policies/components/PolicyList';

export const metadata = { title: 'Policies — NFX' };

export default function PoliciesPage() {
  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Company Policies</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Read and acknowledge all required policy documents.
        </p>
      </div>
      <PolicyList />
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] Policy list page shows all documents from SharePoint with read/unread badges
- [ ] Unread documents appear in a "Requires your attention" section above completed ones
- [ ] Clicking a `PolicyCard` opens the `PolicyViewer` modal
- [ ] PDF documents render in the viewer with no Download, Print, or Open buttons visible
- [ ] DOCX documents render as HTML in the viewer; right-click context menu is disabled
- [ ] `AcknowledgementBanner` shows "I have read this document" button for unread docs
- [ ] Clicking the acknowledgement button fires the mutation; banner updates to "✓ Acknowledged" on success
- [ ] After acknowledgement, the `PolicyCard` badge updates to "Read" without page refresh (TanStack Query cache invalidation)
- [ ] Closing the modal and reopening the same document shows it as acknowledged
- [ ] Unsupported file types show a "Preview not available" message
