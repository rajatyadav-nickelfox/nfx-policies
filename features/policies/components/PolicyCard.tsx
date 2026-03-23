import { Card } from '@/components/ui/Card';
import { ReadBadge } from './ReadBadge';
import type { PolicyFile } from '@/types/policy';

interface PolicyCardProps {
  policy: PolicyFile;
  onClick: (policy: PolicyFile) => void;
}

const FILE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pdf:   { label: 'PDF',  color: '#dc2626', bg: '#fef2f2' },
  docx:  { label: 'DOC',  color: '#2563eb', bg: '#eff6ff' },
  pptx:  { label: 'PPT',  color: '#d97706', bg: '#fffbeb' },
  other: { label: 'DOC',  color: '#64748b', bg: '#f1f5f9' },
};

function FileTypeChip({ fileType }: { fileType: string }) {
  const cfg = FILE_TYPE_CONFIG[fileType] ?? FILE_TYPE_CONFIG.other;
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[11px] font-bold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </div>
  );
}

export function PolicyCard({ policy, onClick }: PolicyCardProps) {
  const accentClass = policy.acknowledged
    ? 'border-l-2 border-l-status-read'
    : 'border-l-2 border-l-status-unread';

  return (
    <Card onClick={() => onClick(policy)} className={accentClass}>
      <div className="flex items-start gap-3">
        <FileTypeChip fileType={policy.fileType} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{policy.name}</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {FILE_TYPE_CONFIG[policy.fileType]?.label ?? 'Document'}
          </p>
          {policy.acknowledgedAt && (
            <p className="mt-1 text-xs text-text-secondary">
              Acknowledged {new Date(policy.acknowledgedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <ReadBadge acknowledged={policy.acknowledged} />
      </div>
    </Card>
  );
}
