import fs from 'fs';
import path from 'path';
import { StorageProvider, UploadFileOptions, StoredAssetResult } from './types';

export class LocalStorageProvider implements StorageProvider {
  name: 'local' = 'local';
  private uploadsBaseDir: string;

  constructor() {
    // Write into frontend public/uploads directory so Next.js serves them at /uploads/...
    // From backend/src/services/storage, root is 4 levels up
    this.uploadsBaseDir = path.resolve(__dirname, '../../../../public/uploads');
    if (!fs.existsSync(this.uploadsBaseDir)) {
      fs.mkdirSync(this.uploadsBaseDir, { recursive: true });
    }
  }

  async upload(options: UploadFileOptions): Promise<StoredAssetResult> {
    const safeFolder = (options.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.join(this.uploadsBaseDir, safeFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(options.originalFilename) || '';
    const rawName = path.basename(options.originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const storedFilename = options.customFilename || `${rawName}_${timestamp}${ext}`;
    const targetFilePath = path.join(targetDir, storedFilename);

    await fs.promises.writeFile(targetFilePath, options.buffer);

    const publicUrl = `/uploads/${safeFolder}/${storedFilename}`;

    return {
      storedFilename,
      publicUrl,
      thumbnailUrl: publicUrl,
      storageReference: `${safeFolder}/${storedFilename}`,
      provider: 'local',
    };
  }

  async delete(storageReference: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadsBaseDir, storageReference);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[LocalStorageProvider] Delete error:', err);
      return false;
    }
  }

  getPublicUrl(storageReference: string): string {
    return `/uploads/${storageReference.replace(/\\/g, '/')}`;
  }
}
