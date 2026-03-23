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
      queryClient.invalidateQueries({ queryKey: policyKeys.list() });
      queryClient.invalidateQueries({ queryKey: ackKeys.mine() });
    },
  });
}
