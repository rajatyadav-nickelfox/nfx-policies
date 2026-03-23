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
  const total = policies.length;
  const percent = total > 0 ? Math.round((read.length / total) * 100) : 0;

  return (
    <>
      <div className="mb-6 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-text-primary">Compliance Progress</span>
          <span className="text-text-secondary">{read.length} / {total} acknowledged</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        {percent === 100 && (
          <p className="mt-2 text-xs font-medium text-status-read">All policies acknowledged!</p>
        )}
      </div>
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
