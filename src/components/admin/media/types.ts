export interface MediaAsset {
  id: string;
  originalFilename: string;
  storedFilename: string;
  assetType: 'image' | 'video' | 'document';
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  storageProvider: 'local' | 'r2' | 'cloudinary';
  storageReference: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  altText: string;
  caption?: string | null;
  copyright?: string | null;
  focalPoint: string;
  folder: string;
  uploadedById?: string | null;
  uploadedByEmail?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  usage?: MediaUsageItem[];
  inActiveUse?: boolean;
}

export interface MediaUsageItem {
  pageId: string;
  pageName: string;
  sectionKey: string;
  inPublished: boolean;
  inDraft: boolean;
}
