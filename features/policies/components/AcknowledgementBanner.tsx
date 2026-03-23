'use client';

import { Button } from '@/components/ui/Button';

interface AcknowledgementBannerProps {
  acknowledged: boolean;
  isLoading: boolean;
  onAcknowledge: () => void;
}

export function AcknowledgementBanner({
  acknowledged,
  isLoading,
  onAcknowledge,
}: AcknowledgementBannerProps) {
  if (acknowledged) {
    return (
      <div className="flex items-center gap-2 border-t border-border bg-accent-light px-6 py-4">
        <span className="text-sm font-medium text-status-read">
          ✓ You have acknowledged this document
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-border bg-surface px-6 py-4">
      <p className="text-sm text-text-secondary">
        Please read the full document before acknowledging.
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={onAcknowledge}
        isLoading={isLoading}
        disabled={isLoading}
      >
        I have read this document
      </Button>
    </div>
  );
}
