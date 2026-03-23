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
      <PolicyViewer />
    </>
  );
}
