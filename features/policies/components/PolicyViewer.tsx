'use client';

import { usePolicyStore } from '../store/policyStore';
import { usePolicies } from '../hooks/usePolicies';
import { usePolicyViewer } from '../hooks/usePolicyViewer';
import { Modal } from '@/components/ui/Modal';
import { PdfViewer } from './PdfViewer';
import { DocxViewer } from './DocxViewer';
import { AcknowledgementBanner } from './AcknowledgementBanner';
import { isPreviewSupported } from '@/utils/fileUtils';

export function PolicyViewer() {
  const { openDocumentId, openDocumentName, closeViewer } = usePolicyStore();
  const { data: policies } = usePolicies();

  const currentPolicy = policies?.find((p) => p.id === openDocumentId) ?? null;

  const { isAcknowledging, hasAcknowledged, handleAcknowledge } = usePolicyViewer(
    openDocumentId,
    currentPolicy?.version ?? null
  );

  const isAcknowledged = hasAcknowledged || (currentPolicy?.acknowledged ?? false);

  if (!openDocumentId || !currentPolicy) return null;

  const canPreview = isPreviewSupported(currentPolicy.fileType);

  return (
    <Modal
      isOpen={!!openDocumentId}
      onClose={closeViewer}
      title={openDocumentName ?? 'Document'}
      size="full"
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto">
          {!canPreview ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-text-primary">Preview not available</p>
              <p className="mt-1 text-xs text-text-secondary">
                This file type ({currentPolicy.fileType}) cannot be previewed in the browser.
              </p>
            </div>
          ) : currentPolicy.fileType === 'pdf' ? (
            <PdfViewer documentId={openDocumentId} />
          ) : (
            <DocxViewer documentId={openDocumentId} />
          )}
        </div>
        <AcknowledgementBanner
          acknowledged={isAcknowledged}
          isLoading={isAcknowledging}
          onAcknowledge={handleAcknowledge}
        />
      </div>
    </Modal>
  );
}
