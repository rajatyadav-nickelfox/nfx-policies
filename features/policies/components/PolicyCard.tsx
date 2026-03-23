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
