export interface GraphDriveItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  eTag: string;
  webUrl: string;
  file?: {
    mimeType: string;
  };
  '@microsoft.graph.downloadUrl'?: string;
}

export interface PolicyFile {
  id: string;
  sharepointItemId: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'other';
  lastModified?: string;
  version: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
}
