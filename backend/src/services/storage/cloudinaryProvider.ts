import crypto from 'crypto';
import path from 'path';
import { StorageProvider, UploadFileOptions, StoredAssetResult } from './types';

export class CloudinaryStorageProvider implements StorageProvider {
  name: 'cloudinary' = 'cloudinary';
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  }

  async upload(options: UploadFileOptions): Promise<StoredAssetResult> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const safeFolder = (options.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(options.originalFilename);
    const rawName = path.basename(options.originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${safeFolder}/${rawName}_${Date.now()}`;

    // Cloudinary signature generation: parameters in alphabetical order
    const paramsToSign = `folder=${safeFolder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const resourceType = options.mimeType.startsWith('video/') ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(options.buffer)], { type: options.mimeType });
    formData.append('file', blob, options.originalFilename);
    formData.append('api_key', this.apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('public_id', publicId);
    formData.append('folder', safeFolder);
    formData.append('signature', signature);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudinary upload failed (${response.status}): ${errText}`);
    }

    const data = await response.json();

    const secureUrl = data.secure_url || data.url;
    // Thumbnail generation: for images, c_scale,w_400; for videos, jpg snapshot
    let thumbnailUrl = secureUrl;
    if (resourceType === 'image') {
      thumbnailUrl = secureUrl.replace('/upload/', '/upload/c_scale,w_400/');
    } else if (resourceType === 'video') {
      thumbnailUrl = secureUrl.replace(/\.[a-zA-Z0-9]+$/, '.jpg');
    }

    return {
      storedFilename: path.basename(publicId),
      publicUrl: secureUrl,
      thumbnailUrl,
      storageReference: data.public_id || publicId,
      provider: 'cloudinary',
      bucket: this.cloudName,
    };
  }

  async delete(storageReference: string, _targetBucket?: string): Promise<boolean> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) return false;

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `public_id=${storageReference}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const destroyUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;
    const formData = new FormData();
    formData.append('public_id', storageReference);
    formData.append('api_key', this.apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    try {
      const res = await fetch(destroyUrl, { method: 'POST', body: formData });
      return res.ok;
    } catch {
      return false;
    }
  }

  getPublicUrl(storageReference: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${storageReference}`;
  }
}
