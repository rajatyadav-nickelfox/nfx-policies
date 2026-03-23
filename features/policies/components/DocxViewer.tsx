'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DocxViewerProps {
  documentId: string;
}

export function DocxViewer({ documentId }: DocxViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetch(`/api/policies/${documentId}/html`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load document');
        return res.json() as Promise<{ html: string }>;
      })
      .then((data) => setHtml(data.html))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [documentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-text-primary">Preview unavailable</p>
        <p className="mt-1 text-xs text-text-secondary">
          This document format cannot be previewed.
        </p>
      </div>
    );
  }

  return (
    <div
      className="policy-docx-body mx-auto max-w-3xl px-8 py-6"
      onContextMenu={(e) => e.preventDefault()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
