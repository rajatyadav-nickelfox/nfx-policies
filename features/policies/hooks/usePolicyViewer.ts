import { useEffect } from 'react';
import { usePolicyStore } from '../store/policyStore';
import { useLogReadEvent } from '../mutations/useLogReadEvent';
import { useAcknowledge } from '../mutations/useAcknowledge';

export function usePolicyViewer(documentId: string | null, documentVersion: string | null) {
  const { currentReadEventId, setReadEventId } = usePolicyStore();
  const logReadEvent = useLogReadEvent();
  const acknowledge = useAcknowledge();

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
    acknowledge.mutate({ documentId, readEventId: currentReadEventId, documentVersion });
  }

  return {
    isAcknowledging: acknowledge.isPending,
    hasAcknowledged: acknowledge.isSuccess,
    handleAcknowledge,
  };
}
