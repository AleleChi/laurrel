import { Readable } from 'stream';

export interface StoredAssetResult {
  storedFilename: string;
  publicUrl: string;
  thumbnailUrl?: string;
  storageReference: string;
  provider: 'local' | 'r2' | 'cloudinary';
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
  delete(storageReference: string): Promise<boolean>;
  getPublicUrl(storageReference: string): string;
}
