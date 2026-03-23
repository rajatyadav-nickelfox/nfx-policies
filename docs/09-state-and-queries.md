# Task 09 — State Management (TanStack Query + Zustand)

## Goal

Set up TanStack Query for all server state and Zustand for UI state. Create the query/mutation hooks that the policy feature components will consume.

---

## Files to Create

- `lib/queryClient.ts`
- `features/policies/queries/policyQueries.ts`
- `features/policies/queries/acknowledgementQueries.ts`
- `features/policies/mutations/useLogReadEvent.ts`
- `features/policies/mutations/useAcknowledge.ts`
- `features/policies/hooks/usePolicies.ts`
- `features/policies/hooks/useAcknowledgements.ts`
- `features/policies/store/policyStore.ts`

---

## Step-by-Step Tasks

### 1. Query client — `lib/queryClient.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes — policy list doesn't change often
      gcTime: 1000 * 60 * 10,      // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 2. Policy query keys & fetch functions — `features/policies/queries/policyQueries.ts`

```typescript
import type { PolicyFile } from '@/types/policy';

// Query key factory — centralised to prevent typos and enable targeted invalidation
export const policyKeys = {
  all: ['policies'] as const,
  list: () => [...policyKeys.all, 'list'] as const,
  detail: (id: string) => [...policyKeys.all, 'detail', id] as const,
};

export async function fetchPolicies(): Promise<PolicyFile[]> {
  const res = await fetch('/api/policies');
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}
```

### 3. Acknowledgement query keys & fetch — `features/policies/queries/acknowledgementQueries.ts`

```typescript
export const ackKeys = {
  all: ['acknowledgements'] as const,
  mine: () => [...ackKeys.all, 'mine'] as const,
};

export interface AckRecord {
  document_id: string;
  document_version: string;
  acknowledged_at: string;
}

export async function fetchMyAcknowledgements(): Promise<AckRecord[]> {
  const res = await fetch('/api/me/acknowledgements');
  if (!res.ok) throw new Error('Failed to fetch acknowledgements');
  return res.json();
}
```

### 4. Policies hook — `features/policies/hooks/usePolicies.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { policyKeys, fetchPolicies } from '../queries/policyQueries';

export function usePolicies() {
  return useQuery({
    queryKey: policyKeys.list(),
    queryFn: fetchPolicies,
  });
}
```

### 5. Acknowledgements hook — `features/policies/hooks/useAcknowledgements.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { ackKeys, fetchMyAcknowledgements } from '../queries/acknowledgementQueries';

export function useAcknowledgements() {
  return useQuery({
    queryKey: ackKeys.mine(),
    queryFn: fetchMyAcknowledgements,
  });
}
```

### 6. Log read event mutation — `features/policies/mutations/useLogReadEvent.ts`

Called when the user opens the document viewer. Returns the `readEventId` to be stored locally for the acknowledgement step.

```typescript
import { useMutation } from '@tanstack/react-query';

interface LogReadEventInput {
  documentId: string;
}

interface LogReadEventOutput {
  readEventId: string;
}

async function logReadEvent(input: LogReadEventInput): Promise<LogReadEventOutput> {
  const res = await fetch('/api/read-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to log read event');
  return res.json();
}

export function useLogReadEvent() {
  return useMutation({
    mutationFn: logReadEvent,
    // No cache invalidation needed — read events are fire-and-forget audit logs
  });
}
```

### 7. Acknowledge mutation — `features/policies/mutations/useAcknowledge.ts`

Called when the user clicks "I have read this document". Invalidates the policy list cache so `acknowledged: true` is reflected immediately.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { policyKeys } from '../queries/policyQueries';
import { ackKeys } from '../queries/acknowledgementQueries';

interface AcknowledgeInput {
  documentId: string;
  readEventId: string;
  documentVersion: string;
}

async function submitAcknowledgement(input: AcknowledgeInput): Promise<void> {
  const res = await fetch('/api/acknowledgements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to submit acknowledgement');
}

export function useAcknowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitAcknowledgement,
    onSuccess: () => {
      // Invalidate policy list so acknowledged status refreshes
      queryClient.invalidateQueries({ queryKey: policyKeys.list() });
      queryClient.invalidateQueries({ queryKey: ackKeys.mine() });
    },
  });
}
```

### 8. Policy UI store — `features/policies/store/policyStore.ts`

Only UI state (no server data) lives here.

```typescript
import { create } from 'zustand';

interface PolicyViewerState {
  // Currently open document
  openDocumentId: string | null;
  openDocumentName: string | null;

  // Read event ID returned by the API when viewer opens
  currentReadEventId: string | null;

  // Actions
  openViewer: (id: string, name: string) => void;
  closeViewer: () => void;
  setReadEventId: (id: string) => void;
}

export const usePolicyStore = create<PolicyViewerState>((set) => ({
  openDocumentId: null,
  openDocumentName: null,
  currentReadEventId: null,

  openViewer: (id, name) =>
    set({ openDocumentId: id, openDocumentName: name, currentReadEventId: null }),

  closeViewer: () =>
    set({ openDocumentId: null, openDocumentName: null, currentReadEventId: null }),

  setReadEventId: (id) => set({ currentReadEventId: id }),
}));
```

### 9. Policy viewer state hook — `features/policies/hooks/usePolicyViewer.ts`

Thin wrapper that combines Zustand store + mutations into a single convenient API for `PolicyViewer.tsx`.

```typescript
import { useEffect } from 'react';
import { usePolicyStore } from '../store/policyStore';
import { useLogReadEvent } from '../mutations/useLogReadEvent';
import { useAcknowledge } from '../mutations/useAcknowledge';

export function usePolicyViewer(documentId: string | null, documentVersion: string | null) {
  const { currentReadEventId, setReadEventId } = usePolicyStore();
  const logReadEvent = useLogReadEvent();
  const acknowledge = useAcknowledge();

  // Log read event when viewer opens
  useEffect(() => {
    if (!documentId) return;

    logReadEvent.mutate(
      { documentId },
      { onSuccess: (data) => setReadEventId(data.readEventId) }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  function handleAcknowledge() {
    if (!documentId || !currentReadEventId || !documentVersion) return;

    acknowledge.mutate({
      documentId,
      readEventId: currentReadEventId,
      documentVersion,
    });
  }

  return {
    isAcknowledging: acknowledge.isPending,
    hasAcknowledged: acknowledge.isSuccess,
    handleAcknowledge,
  };
}
```

---

## State Management Decision Rules

Use **TanStack Query** for:
- Any data that comes from an API endpoint
- Any data that needs caching, loading states, or error handling
- Any action that modifies server state (useMutation)

Use **Zustand** for:
- Which document is currently open in the viewer
- Whether the sidebar is collapsed (on mobile)
- Any ephemeral UI state that does not need to be persisted or shared with the server

**Never** store API responses directly in Zustand — use TanStack Query cache.

---

## Acceptance Criteria

- [ ] `usePolicies()` returns `{ data, isLoading, error }` and refetches after 5 minutes
- [ ] `useAcknowledge()` invalidates the policy list cache on success — `PolicyCard` shows `acknowledged: true` without page refresh
- [ ] `useLogReadEvent()` fires when `PolicyViewer` mounts and stores the returned `readEventId`
- [ ] `policyStore` correctly tracks `openDocumentId` — opening one document closes the previous
- [ ] `QueryClientProvider` is present in the dashboard layout (via `SessionGuard`)
