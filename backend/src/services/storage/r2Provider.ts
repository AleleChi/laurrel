import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { StorageProvider, UploadFileOptions, StoredAssetResult } from './types';

export class CloudflareR2StorageProvider implements StorageProvider {
  name: 'r2' = 'r2';
  private s3Client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    this.bucket = process.env.R2_BUCKET_NAME || '';
    this.publicBaseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket) {
      throw new Error(
        '[CloudflareR2StorageProvider] Missing S3 credentials or bucket name in environment.'
      );
    }

    if (!this.publicBaseUrl) {
      throw new Error(
        '[CloudflareR2StorageProvider] R2_PUBLIC_URL is not configured. Public URLs must be generated from the configured public delivery domain, never from private S3 API endpoints.'
      );
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(options: UploadFileOptions): Promise<StoredAssetResult> {
    const safeFolder = (options.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(options.originalFilename) || '';
    const rawName = path.basename(options.originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const storedFilename = options.customFilename || `${rawName}_${timestamp}${ext}`;
    const objectKey = `${safeFolder}/${storedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: options.buffer,
      ContentType: options.mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.s3Client.send(command);

    const isVideo = options.mimeType.startsWith('video/');
    const publicUrl = `${this.publicBaseUrl}/${objectKey}`;

    return {
      storedFilename,
      publicUrl,
      thumbnailUrl: isVideo ? undefined : publicUrl,
      storageReference: objectKey,
      provider: 'r2',
    };
  }

  async delete(storageReference: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageReference,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err) {
      console.error('[CloudflareR2StorageProvider] Delete error:', err);
      return false;
    }
  }

  getPublicUrl(storageReference: string): string {
    return `${this.publicBaseUrl}/${storageReference.replace(/\\/g, '/')}`;
  }
}
