export interface StoredAssetResult {
  storedFilename: string;
  publicUrl: string;
  thumbnailUrl?: string;
  storageReference: string;
  provider: 'local' | 'r2' | 'cloudinary';
  bucket?: string;
}

export interface UploadFileOptions {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  folder: string;
  customFilename?: string;
}

export interface StorageProvider {
  name: 'local' | 'r2' | 'cloudinary';
  upload(options: UploadFileOptions): Promise<StoredAssetResult>;
  delete(storageReference: string, targetBucket?: string): Promise<boolean>;
  getPublicUrl(storageReference: string): string;
}
