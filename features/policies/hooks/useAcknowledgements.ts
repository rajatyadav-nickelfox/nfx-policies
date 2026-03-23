import { useQuery } from '@tanstack/react-query';
import { ackKeys, fetchMyAcknowledgements } from '../queries/acknowledgementQueries';

export function useAcknowledgements() {
  return useQuery({
    queryKey: ackKeys.mine(),
    queryFn: fetchMyAcknowledgements,
  });
}
