import { Router, Request, Response } from 'express';
import multer from 'multer';
import sizeOf from 'image-size';
import { requireAdminAuth, requireRole } from '../middleware/auth';
import {
  createMediaAsset,
  getMediaAssetById,
  listMediaAssets,
  updateMediaAsset,
  archiveMediaAsset,
  deleteMediaAsset,
  getMediaAssetUsage,
  recordMediaAuditEvent,
  ListMediaOptions,
} from '../database/mediaRepo';
import { getStorageProvider, getStorageProviderByName, StorageProvider } from '../services/storage';

export const mediaRouter = Router();

// Configure Multer for in-memory handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (sufficient for web videos and high-res imagery)
  },
});

// Explicit whitelist of allowed MIME types. SVG is excluded until secure XML sanitization is provisioned.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

/**
 * Validate actual file buffer magic bytes to ensure file content matches MIME header.
 * Rejects malformed files, active scripts, or disguised executables.
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: RIFF .... WEBP
  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  // AVIF: ISOBMFF container with 'ftyp' box and 'avif' / 'avis' brand
  if (mimeType === 'image/avif') {
    if (buffer.length < 12) return false;
    const boxType = buffer.toString('ascii', 4, 8);
    if (boxType !== 'ftyp') return false;
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis') return true;
    const headerPrefix = buffer.toString('ascii', 8, Math.min(buffer.length, 64));
    return headerPrefix.includes('avif') || headerPrefix.includes('avis');
  }

  // MP4 / QuickTime: 'ftyp' box or 'moov' atom
  if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
    if (buffer.length < 12) return false;
    const boxType = buffer.toString('ascii', 4, 8);
    return boxType === 'ftyp' || buffer.toString('ascii', 4, 12).includes('moov');
  }

  // WebM: EBML header (0x1A 0x45 0xDF 0xA3) with 'webm' DocType
  if (mimeType === 'video/webm') {
    if (buffer.length < 8) return false;
    const isEbml =
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3;
    if (!isEbml) return false;
    const header = buffer.toString('latin1', 0, Math.min(buffer.length, 128));
    return header.includes('webm');
  }

  // Default reject: any unhandled or unrecognized file
  return false;
}

// ============================================================================
// 1. LIST MEDIA ASSETS
// ============================================================================
mediaRouter.get(
  '/api/admin/media',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        search,
        folder,
        assetType,
        isArchived,
        sort,
        limit,
        offset,
      } = req.query;

      const options: ListMediaOptions = {
        search: typeof search === 'string' ? search : undefined,
        folder: typeof folder === 'string' ? folder : undefined,
        assetType: assetType === 'image' || assetType === 'video' ? assetType : 'all',
        isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : false,
        sort: (sort as any) || 'date_desc',
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      };

      const result = await listMediaAssets(options);
      res.json({
        success: true,
        data: result.assets,
        total: result.total,
        limit: options.limit,
        offset: options.offset,
      });
    } catch (err: any) {
      console.error('[Media Router] List error:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve media assets.' });
    }
  }
);

// ============================================================================
// 2. GET SINGLE MEDIA ASSET WITH USAGE REFERENCES
// ============================================================================
mediaRouter.get(
  '/api/admin/media/:id',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const asset = await getMediaAssetById(req.params.id);
      if (!asset) {
        res.status(404).json({ success: false, error: 'Media asset not found.' });
        return;
      }

      let usage: any[] = [];
      try {
        usage = await getMediaAssetUsage(asset.id, asset.publicUrl);
      } catch (usageErr: any) {
        console.error('[Media Router] Detail usage lookup error:', usageErr);
        res.status(500).json({
          success: false,
          error: `Failed to retrieve media asset usage references: ${usageErr.message}.`,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ...asset,
          usage,
          inActiveUse: usage.some((u) => u.inPublished),
          inRevisionHistory: usage.some((u) => u.inRevisionHistory),
        },
      });
    } catch (err: any) {
      console.error('[Media Router] Detail error:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve media asset details.' });
    }
  }
);

// ============================================================================
// 3. UPLOAD MEDIA ASSET
// ============================================================================
mediaRouter.post(
  '/api/admin/media/upload',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor']),
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: 'No file provided for upload.' });
        return;
      }

      const mimeType = file.mimetype.toLowerCase();

      // Specifically intercept SVG uploads and reject with security notice
      if (mimeType === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg')) {
        res.status(400).json({
          success: false,
          error:
            'SVG uploads are currently disabled for security until an isolated XML sanitization pipeline is provisioned.',
        });
        return;
      }

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        res.status(400).json({
          success: false,
          error: `Unsupported file type '${mimeType}'. Allowed formats: JPEG, PNG, WebP, AVIF, MP4, WebM, QuickTime.`,
        });
        return;
      }

      // Check file magic bytes signature
      if (!validateFileSignature(file.buffer, mimeType)) {
        res.status(400).json({
          success: false,
          error: 'File content does not match its declared format signature. Upload rejected for security.',
        });
        return;
      }

      const isVideo = mimeType.startsWith('video/');
      const isImage = mimeType.startsWith('image/');

      // Max size checks
      if (isImage && file.size > 15 * 1024 * 1024) {
        res.status(400).json({ success: false, error: 'Images must be 15MB or smaller.' });
        return;
      }

      let width: number | null = null;
      let height: number | null = null;

      if (isImage) {
        try {
          const dims = sizeOf(file.buffer);
          width = dims.width || null;
          height = dims.height || null;
        } catch {
          console.warn('Could not extract image dimensions from buffer');
        }
      } else if (isVideo) {
        width = 1920;
        height = 1080;
      }

      const folder = (req.body.folder || 'general').trim().toLowerCase();
      const altText = (req.body.altText || '').trim();
      const caption = (req.body.caption || '').trim();
      const focalPoint = (req.body.focalPoint || 'center').trim();
      const copyright = (req.body.copyright || '').trim();

      // Upload via active Storage Provider
      const storage = getStorageProvider();
      const stored = await storage.upload({
        buffer: file.buffer,
        originalFilename: file.originalname,
        mimeType,
        folder,
      });

      // Persist in Neon DB with bucket & provider tracking
      const asset = await createMediaAsset({
        originalFilename: file.originalname,
        storedFilename: stored.storedFilename,
        assetType: isVideo ? 'video' : 'image',
        mimeType,
        fileSize: file.size,
        width,
        height,
        duration: isVideo ? 10.0 : null,
        storageProvider: stored.provider,
        storageBucket: stored.bucket || null,
        storageReference: stored.storageReference,
        publicUrl: stored.publicUrl,
        thumbnailUrl: isVideo ? (stored.thumbnailUrl || null) : (stored.thumbnailUrl || stored.publicUrl),
        altText,
        caption: caption || null,
        copyright: copyright || null,
        focalPoint,
        folder,
        uploadedById: req.adminUser?.id,
        uploadedByEmail: req.adminUser?.email,
      });

      await recordMediaAuditEvent('media_upload', asset.id, {
        adminUserId: req.adminUser?.id,
        adminUserEmail: req.adminUser?.email,
        ipAddress: req.ip,
        originalFilename: asset.originalFilename,
        size: asset.fileSize,
        publicUrl: asset.publicUrl,
        provider: asset.storageProvider,
        bucket: asset.storageBucket,
      });

      res.status(201).json({
        success: true,
        data: asset,
        message: 'Media asset uploaded and registered successfully.',
      });
    } catch (err: any) {
      console.error('[Media Router] Upload error:', err);
      res.status(500).json({ success: false, error: err.message || 'File upload failed.' });
    }
  }
);

// ============================================================================
// 4. UPDATE MEDIA ASSET METADATA
// ============================================================================
mediaRouter.patch(
  '/api/admin/media/:id',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const asset = await getMediaAssetById(req.params.id);
      if (!asset) {
        res.status(404).json({ success: false, error: 'Media asset not found.' });
        return;
      }

      const { altText, caption, copyright, focalPoint, folder, thumbnailUrl } = req.body;

      const updated = await updateMediaAsset(asset.id, {
        altText: typeof altText === 'string' ? altText.trim() : undefined,
        caption: typeof caption === 'string' ? caption.trim() : undefined,
        copyright: typeof copyright === 'string' ? copyright.trim() : undefined,
        focalPoint: typeof focalPoint === 'string' ? focalPoint.trim() : undefined,
        folder: typeof folder === 'string' ? folder.trim() : undefined,
        thumbnailUrl: typeof thumbnailUrl === 'string' ? thumbnailUrl.trim() : undefined,
      });

      await recordMediaAuditEvent('media_update_metadata', asset.id, {
        adminUserId: req.adminUser?.id,
        adminUserEmail: req.adminUser?.email,
        ipAddress: req.ip,
        changes: req.body,
      });

      res.json({
        success: true,
        data: updated,
        message: 'Media asset metadata updated successfully.',
      });
    } catch (err: any) {
      console.error('[Media Router] Metadata update error:', err);
      res.status(500).json({ success: false, error: 'Failed to update media asset metadata.' });
    }
  }
);

// ============================================================================
// 5. ARCHIVE / UNARCHIVE MEDIA ASSET
// ============================================================================
mediaRouter.post(
  '/api/admin/media/:id/archive',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const asset = await getMediaAssetById(req.params.id);
      if (!asset) {
        res.status(404).json({ success: false, error: 'Media asset not found.' });
        return;
      }

      const isArchived = req.body.isArchived !== false;
      const updated = await archiveMediaAsset(asset.id, isArchived);

      await recordMediaAuditEvent(isArchived ? 'media_archive' : 'media_unarchive', asset.id, {
        adminUserId: req.adminUser?.id,
        adminUserEmail: req.adminUser?.email,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: updated,
        message: isArchived ? 'Asset archived successfully.' : 'Asset unarchived successfully.',
      });
    } catch (err: any) {
      console.error('[Media Router] Archive error:', err);
      res.status(500).json({ success: false, error: 'Failed to update asset archive status.' });
    }
  }
);

// ============================================================================
// 6. GUARDED PERMANENT DELETE (PREVENTS BREAKING LIVE PAGES & CMS REVISIONS)
// ============================================================================
mediaRouter.delete(
  '/api/admin/media/:id',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const asset = await getMediaAssetById(req.params.id);
      if (!asset) {
        res.status(404).json({ success: false, error: 'Media asset not found.' });
        return;
      }

      // Check where asset is currently referenced
      let usage: any[];
      try {
        usage = await getMediaAssetUsage(asset.id, asset.publicUrl);
      } catch (usageErr: any) {
        console.error('[Media Router] Failed to verify asset usage references:', usageErr);
        res.status(500).json({
          success: false,
          error: `Failed to verify media asset usage references: ${usageErr.message}. Deletion aborted to prevent accidental destruction of active content.`,
        });
        return;
      }

      const activePublished = usage.filter((u) => u.inPublished);
      const inRevisions = usage.filter((u) => u.inRevisionHistory);

      // Guard 1: Block deletion if referenced in live published content
      if (activePublished.length > 0) {
        const locations = activePublished.map((u) => `${u.pageName} (${u.sectionKey})`).join(', ');
        res.status(409).json({
          success: false,
          error: `Cannot delete asset '${asset.originalFilename}': it is actively referenced in published website content: ${locations}. Please replace or remove the reference in the page editor first.`,
          usage,
        });
        return;
      }

      // Guard 2: Block deletion if preserved in historical CMS revisions (protects rollback integrity)
      if (inRevisions.length > 0) {
        const locations = inRevisions.map((u) => `${u.pageName} (${u.sectionKey})`).join(', ');
        res.status(409).json({
          success: false,
          error: `Cannot delete asset '${asset.originalFilename}': it is preserved in historical CMS revisions (${locations}) to safeguard rollback integrity. You may archive this asset instead.`,
          usage,
        });
        return;
      }

      // Guard 3: Block physical deletion of any R2 asset whose bucket cannot be verified
      if (asset.storageProvider === 'r2' && !asset.storageBucket) {
        res.status(422).json({
          success: false,
          error: `Cannot delete R2 asset '${asset.originalFilename}': Storage bucket ownership is unverified (storage_bucket is null). Physical deletion is blocked to prevent deleting assets from an incorrect or ambiguous bucket.`,
        });
        return;
      }

      // Guard 4: Dispatch physical deletion using the asset's original storage provider & bucket
      let storage: StorageProvider;
      try {
        storage = getStorageProviderByName(
          asset.storageProvider,
          asset.storageBucket || undefined
        );
      } catch (providerErr: any) {
        res.status(500).json({
          success: false,
          error: `Storage provider '${asset.storageProvider}' is not available: ${providerErr.message}. Asset metadata preserved.`,
        });
        return;
      }

      const storageDeleted = await storage.delete(
        asset.storageReference,
        asset.storageBucket || undefined
      );

      // Guard 5: Never delete database metadata if physical storage deletion failed
      if (!storageDeleted) {
        res.status(502).json({
          success: false,
          error: `Physical deletion from storage provider '${asset.storageProvider}' failed for asset '${asset.originalFilename}'. Database metadata has been preserved to avoid an inconsistent or orphaned state.`,
        });
        return;
      }

      // Delete from Neon DB only after physical deletion has succeeded
      await deleteMediaAsset(asset.id);

      await recordMediaAuditEvent('media_delete', asset.id, {
        adminUserId: req.adminUser?.id,
        adminUserEmail: req.adminUser?.email,
        ipAddress: req.ip,
        originalFilename: asset.originalFilename,
        publicUrl: asset.publicUrl,
        storageProvider: asset.storageProvider,
        storageBucket: asset.storageBucket,
      });

      res.json({
        success: true,
        message: `Asset '${asset.originalFilename}' deleted successfully from ${asset.storageProvider} storage and catalog.`,
      });
    } catch (err: any) {
      console.error('[Media Router] Delete error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete media asset.' });
    }
  }
);
