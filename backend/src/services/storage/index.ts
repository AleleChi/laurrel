import { StorageProvider } from './types';
import { LocalStorageProvider } from './localProvider';
import { CloudflareR2StorageProvider } from './r2Provider';
import { CloudinaryStorageProvider } from './cloudinaryProvider';

export * from './types';

let cachedDefaultProvider: StorageProvider | null = null;

/**
 * Returns the currently active default storage provider for new uploads.
 */
export function getStorageProvider(): StorageProvider {
  if (cachedDefaultProvider) {
    return cachedDefaultProvider;
  }

  const configuredProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase().trim() as
    | 'local'
    | 'r2'
    | 'cloudinary';

  cachedDefaultProvider = getStorageProviderByName(configuredProvider);
  return cachedDefaultProvider;
}

/**
 * Returns a storage provider by name and optional target bucket.
 * This guarantees that assets are managed by their original storage provider and bucket,
 * preventing accidental deletion of staging assets from production buckets, or local files via R2.
 */
export function getStorageProviderByName(
  providerName: 'local' | 'r2' | 'cloudinary',
  targetBucket?: string
): StorageProvider {
  if (providerName === 'r2') {
    const missing: string[] = [];
    if (!process.env.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
    if (!process.env.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
    if (!targetBucket && !process.env.R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');
    if (!process.env.R2_PUBLIC_URL) missing.push('R2_PUBLIC_URL');

    if (missing.length > 0) {
      throw new Error(
        `[Storage Configuration Error] STORAGE_PROVIDER is 'r2', but required configuration is missing: ${missing.join(', ')}. Silent fallback to local storage is disabled.`
      );
    }

    return new CloudflareR2StorageProvider(targetBucket);
  }

  if (providerName === 'cloudinary') {
    const missing: string[] = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');

    if (missing.length > 0) {
      throw new Error(
        `[Storage Configuration Error] STORAGE_PROVIDER is 'cloudinary', but required configuration is missing: ${missing.join(', ')}. Silent fallback to local storage is disabled.`
      );
    }

    return new CloudinaryStorageProvider();
  }

  return new LocalStorageProvider();
}
