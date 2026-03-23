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
  return res.json() as Promise<AckRecord[]>;
}
