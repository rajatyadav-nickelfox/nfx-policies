import type { PolicyFile } from '@/types/policy';

export const policyKeys = {
  all: ['policies'] as const,
  list: () => [...policyKeys.all, 'list'] as const,
  detail: (id: string) => [...policyKeys.all, 'detail', id] as const,
};

export async function fetchPolicies(): Promise<PolicyFile[]> {
  const res = await fetch('/api/policies');
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json() as Promise<PolicyFile[]>;
}
