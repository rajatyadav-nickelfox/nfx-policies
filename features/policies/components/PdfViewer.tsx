'use client';

import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import type { ToolbarSlot } from '@react-pdf-viewer/toolbar';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

const NullSlot = () => <></>;


interface PdfViewerProps {
  documentId: string;
}

export function PdfViewer({ documentId }: PdfViewerProps) {
  const toolbarPluginInstance = toolbarPlugin();
  const { renderDefaultToolbar, Toolbar } = toolbarPluginInstance;

  const transform = (slot: ToolbarSlot): ToolbarSlot => ({
    ...slot,
    Download: NullSlot,
    DownloadMenuItem: NullSlot,
    Print: NullSlot,
    PrintMenuItem: NullSlot,
    Open: NullSlot,
    OpenMenuItem: NullSlot,
  });

  return (
    <div className="h-full w-full overflow-hidden rounded-[var(--radius-md)] border border-border">
      <Worker workerUrl="/pdf.worker.min.js">
        <div className="flex h-full flex-col">
          <div className="border-b border-border bg-surface px-2 py-1">
            <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
          </div>
          <div className="flex-1 overflow-hidden">
            <Viewer
              fileUrl={`/api/policies/${documentId}`}
              plugins={[toolbarPluginInstance]}
            />
          </div>
        </div>
      </Worker>
    </div>
  );
}
