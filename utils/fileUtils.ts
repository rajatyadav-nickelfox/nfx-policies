export type SupportedFileType = 'pdf' | 'docx' | 'pptx' | 'other';

const MIME_TO_TYPE: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

export function fileTypeFromMime(mimeType: string): SupportedFileType {
  return MIME_TO_TYPE[mimeType] ?? 'other';
}

export function fileTypeFromName(name: string): SupportedFileType {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'pptx') return 'pptx';
  return 'other';
}

export function isPreviewSupported(fileType: SupportedFileType): boolean {
  return fileType === 'pdf' || fileType === 'docx';
}
