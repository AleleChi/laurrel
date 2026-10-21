import { StorageProvider } from './types';
import { LocalStorageProvider } from './localProvider';
import { CloudflareR2StorageProvider } from './r2Provider';
import { CloudinaryStorageProvider } from './cloudinaryProvider';

export * from './types';

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const configuredProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase().trim();

  if (configuredProvider === 'r2') {
    const missing: string[] = [];
    if (!process.env.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
    if (!process.env.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');
    if (!process.env.R2_PUBLIC_URL) missing.push('R2_PUBLIC_URL');

    if (missing.length > 0) {
      throw new Error(
        `[Storage Configuration Error] STORAGE_PROVIDER is set to 'r2', but required configuration is missing: ${missing.join(', ')}. Silent fallback to local storage is disabled.`
      );
    }

    cachedProvider = new CloudflareR2StorageProvider();
    return cachedProvider;
  }

  if (configuredProvider === 'cloudinary') {
    const missing: string[] = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');

    if (missing.length > 0) {
      throw new Error(
        `[Storage Configuration Error] STORAGE_PROVIDER is set to 'cloudinary', but required configuration is missing: ${missing.join(', ')}. Silent fallback to local storage is disabled.`
      );
    }

    cachedProvider = new CloudinaryStorageProvider();
    return cachedProvider;
  }

  cachedProvider = new LocalStorageProvider();
  return cachedProvider;
}
