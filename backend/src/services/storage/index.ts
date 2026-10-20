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
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      cachedProvider = new CloudflareR2StorageProvider();
      return cachedProvider;
    }
    console.warn('[Storage] STORAGE_PROVIDER is set to r2, but R2 credentials are missing. Falling back to local storage.');
  }

  if (configuredProvider === 'cloudinary') {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cachedProvider = new CloudinaryStorageProvider();
      return cachedProvider;
    }
    console.warn('[Storage] STORAGE_PROVIDER is set to cloudinary, but credentials are missing. Falling back to local storage.');
  }

  cachedProvider = new LocalStorageProvider();
  return cachedProvider;
}
