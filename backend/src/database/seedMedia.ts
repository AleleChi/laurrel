import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import { getDbPool } from './pool';
import { createMediaAsset, getMediaAssetUsage } from './mediaRepo';

export interface MediaSeedReport {
  assetsRegistered: number;
  assetsSkipped: number;
  details: string[];
}

interface KnownAssetConfig {
  relativePath: string;
  id: string;
  folder: string;
  altText: string;
  caption?: string;
  focalPoint?: string;
  thumbnailUrl?: string;
  duration?: number;
}

const KNOWN_ASSETS: KnownAssetConfig[] = [
  {
    relativePath: 'hero/laurrel-room.png',
    id: 'media_hero_laurrel_room',
    folder: 'hero',
    altText: 'Sunlit living room with pristine cream furniture and architectural staircase in Ottawa, Canada',
    caption: 'Flagship Ottawa interior presentation showcasing Laurrel cleaning and preparation standards',
    focalPoint: 'center',
  },
  {
    relativePath: 'videos/clean.mp4',
    id: 'media_video_clean',
    folder: 'videos',
    altText: 'Laurrel Services cleaning professional inspecting and maintaining residential space in Ottawa',
    caption: 'Hero rotating video showcasing residential cleaning',
    thumbnailUrl: '/assets/videos/cleaning-poster.jpg',
    duration: 12.0,
  },
  {
    relativePath: 'videos/cleaning-poster.jpg',
    id: 'media_poster_cleaning',
    folder: 'videos',
    altText: 'Laurrel Services cleaning professional inspecting and maintaining residential space in Ottawa',
    caption: 'Poster frame for cleaning service video',
    focalPoint: 'center 45%',
  },
  {
    relativePath: 'videos/movinng.mp4',
    id: 'media_video_moving',
    folder: 'videos',
    altText: 'Laurrel Services moving specialist carefully transporting boxed belongings',
    caption: 'Hero rotating video showcasing residential and commercial moving',
    thumbnailUrl: '/assets/videos/moving-poster.jpg',
    duration: 12.0,
  },
  {
    relativePath: 'videos/moving-poster.jpg',
    id: 'media_poster_moving',
    folder: 'videos',
    altText: 'Laurrel Services moving specialist carefully transporting boxed belongings',
    caption: 'Poster frame for moving service video',
    focalPoint: 'center 45%',
  },
  {
    relativePath: 'videos/storagge.mp4',
    id: 'media_video_storage',
    folder: 'videos',
    altText: 'Laurrel Services storage specialist organizing modern, dependable storage facility',
    caption: 'Hero rotating video showcasing secure storage coordination',
    thumbnailUrl: '/assets/videos/storage-poster.jpg',
    duration: 12.0,
  },
  {
    relativePath: 'videos/storage-poster.jpg',
    id: 'media_poster_storage',
    folder: 'videos',
    altText: 'Laurrel Services storage specialist organizing modern, dependable storage facility',
    caption: 'Poster frame for storage coordination video',
    focalPoint: 'center 45%',
  },
  {
    relativePath: 'about/mover-cutout-trimmed.png',
    id: 'media_about_mover_cutout',
    folder: 'about',
    altText: 'Laurrel Services moving specialist transparent cutout silhouette',
    caption: 'Decorative layered team member cutout on About page',
    focalPoint: 'center',
  },
  {
    relativePath: 'brand/laurrel-logo-primary.png',
    id: 'media_brand_logo_primary',
    folder: 'brand',
    altText: 'Laurrel Services Official Primary Brand Logo',
    caption: 'Official deep purple and orange vector-crisp brand logo',
  },
  {
    relativePath: 'brand/laurrel-symbol.png',
    id: 'media_brand_symbol',
    folder: 'brand',
    altText: 'Laurrel Services Architectural Brand Symbol',
    caption: 'Approved architectural brand mark',
  },
  {
    relativePath: 'brand/LAURRELMODIFIED.png',
    id: 'media_brand_logo_source',
    folder: 'brand',
    altText: 'Laurrel Services approved high-resolution brand artwork source',
    caption: 'Approved master rebrand asset',
  },
];

export async function seedMediaAssets(): Promise<MediaSeedReport> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const report: MediaSeedReport = {
    assetsRegistered: 0,
    assetsSkipped: 0,
    details: [],
  };

  const assetsDir = path.resolve(__dirname, '../../../public/assets');
  if (!fs.existsSync(assetsDir)) {
    console.warn(`[Seed Media Warning]: public/assets directory not found at ${assetsDir}`);
    return report;
  }

  // Optimize: query existing asset IDs in one single query to eliminate redundant remote queries on startup
  const existingRes = await pool.query('SELECT id FROM media_assets');
  const existingIds = new Set(existingRes.rows.map((r: any) => r.id));

  for (const config of KNOWN_ASSETS) {
    if (existingIds.has(config.id)) {
      report.assetsSkipped++;
      continue;
    }

    const fullPath = path.join(assetsDir, config.relativePath);
    if (!fs.existsSync(fullPath)) {
      report.details.push(`Skipped (not found): ${config.relativePath}`);
      report.assetsSkipped++;
      continue;
    }

    const stat = fs.statSync(fullPath);
    const ext = path.extname(config.relativePath).toLowerCase();
    const isVideo = ext === '.mp4' || ext === '.webm' || ext === '.mov';
    const isImage = ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp' || ext === '.avif' || ext === '.svg';

    let width: number | null = null;
    let height: number | null = null;
    let mimeType = 'application/octet-stream';

    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.avif') mimeType = 'image/avif';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.mp4') mimeType = 'video/mp4';

    if (isImage) {
      try {
        const fileBuffer = fs.readFileSync(fullPath);
        const dimensions = sizeOf(fileBuffer);
        width = dimensions.width || null;
        height = dimensions.height || null;
      } catch (err) {
        console.warn(`Could not read dimensions for ${config.relativePath}`);
      }
    } else if (isVideo) {
      width = 1920;
      height = 1080;
    }

    const publicUrl = `/assets/${config.relativePath.replace(/\\/g, '/')}`;

    const asset = await createMediaAsset({
      id: config.id,
      originalFilename: path.basename(config.relativePath),
      storedFilename: path.basename(config.relativePath),
      assetType: isVideo ? 'video' : 'image',
      mimeType,
      fileSize: stat.size,
      width,
      height,
      duration: config.duration || null,
      storageProvider: 'local',
      storageReference: `public/assets/${config.relativePath}`,
      publicUrl,
      thumbnailUrl: config.thumbnailUrl || publicUrl,
      altText: config.altText,
      caption: config.caption || null,
      focalPoint: config.focalPoint || 'center',
      folder: config.folder,
      uploadedByEmail: 'system@laurrelservices.ca',
    });

    const usage = await getMediaAssetUsage(asset.id, asset.publicUrl);
    const usageSummary = usage.length > 0
      ? `(Referenced in: ${usage.map((u) => `${u.pageName}->${u.sectionKey}`).join(', ')})`
      : '(No CMS references)';

    report.assetsRegistered++;
    report.details.push(`Registered: [${asset.assetType.toUpperCase()}] ${asset.originalFilename} (${Math.round(asset.fileSize / 1024)} KB) -> ${asset.id} ${usageSummary}`);
  }

  return report;
}

if (require.main === module) {
  seedMediaAssets()
    .then((report) => {
      console.log('=== MEDIA ASSETS SEED REPORT ===');
      console.log(`Assets Registered: ${report.assetsRegistered}`);
      console.log(`Assets Skipped: ${report.assetsSkipped}`);
      report.details.forEach((d) => console.log(`  + ${d}`));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Media Seed Error]:', err);
      process.exit(1);
    });
}
