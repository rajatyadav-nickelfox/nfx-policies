import { useQuery } from '@tanstack/react-query';
import { policyKeys, fetchPolicies } from '../queries/policyQueries';

export function usePolicies() {
  return useQuery({
    queryKey: policyKeys.list(),
    queryFn: fetchPolicies,
  });
}
