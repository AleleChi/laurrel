import { getDbPool } from './pool';

export interface MediaAsset {
  id: string;
  originalFilename: string;
  storedFilename: string;
  assetType: 'image' | 'video' | 'document';
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  storageProvider: 'local' | 'r2' | 'cloudinary';
  storageBucket?: string | null;
  storageReference: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  altText: string;
  caption?: string | null;
  copyright?: string | null;
  focalPoint: string;
  folder: string;
  uploadedById?: string | null;
  uploadedByEmail?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUsageItem {
  pageId: string;
  pageName: string;
  sectionKey: string;
  inPublished: boolean;
  inDraft: boolean;
  inRevisionHistory?: boolean;
}

export interface ListMediaOptions {
  search?: string;
  folder?: string;
  assetType?: 'image' | 'video' | 'all';
  isArchived?: boolean;
  sort?: 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc';
  limit?: number;
  offset?: number;
}

export async function createMediaAsset(data: {
  id?: string;
  originalFilename: string;
  storedFilename: string;
  assetType: 'image' | 'video' | 'document';
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  storageProvider: 'local' | 'r2' | 'cloudinary';
  storageBucket?: string | null;
  storageReference: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  altText?: string;
  caption?: string | null;
  copyright?: string | null;
  focalPoint?: string;
  folder?: string;
  uploadedById?: string | null;
  uploadedByEmail?: string | null;
}): Promise<MediaAsset> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const id = data.id || `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const focalPoint = data.focalPoint || 'center';
  const folder = data.folder || 'general';
  const altText = data.altText || '';

  const query = `
    INSERT INTO media_assets (
      id,
      original_filename,
      stored_filename,
      asset_type,
      mime_type,
      file_size,
      width,
      height,
      duration,
      storage_provider,
      storage_bucket,
      storage_reference,
      public_url,
      thumbnail_url,
      alt_text,
      caption,
      copyright,
      focal_point,
      folder,
      uploaded_by_id,
      uploaded_by_email,
      is_archived,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, FALSE, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      original_filename = EXCLUDED.original_filename,
      stored_filename = EXCLUDED.stored_filename,
      asset_type = EXCLUDED.asset_type,
      mime_type = EXCLUDED.mime_type,
      file_size = EXCLUDED.file_size,
      width = EXCLUDED.width,
      height = EXCLUDED.height,
      duration = EXCLUDED.duration,
      storage_provider = EXCLUDED.storage_provider,
      storage_bucket = EXCLUDED.storage_bucket,
      storage_reference = EXCLUDED.storage_reference,
      public_url = EXCLUDED.public_url,
      thumbnail_url = EXCLUDED.thumbnail_url,
      updated_at = NOW()
    RETURNING
      id,
      original_filename AS "originalFilename",
      stored_filename AS "storedFilename",
      asset_type AS "assetType",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      width,
      height,
      duration,
      storage_provider AS "storageProvider",
      storage_bucket AS "storageBucket",
      storage_reference AS "storageReference",
      public_url AS "publicUrl",
      thumbnail_url AS "thumbnailUrl",
      alt_text AS "altText",
      caption,
      copyright,
      focal_point AS "focalPoint",
      folder,
      uploaded_by_id AS "uploadedById",
      uploaded_by_email AS "uploadedByEmail",
      is_archived AS "isArchived",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const values = [
    id,
    data.originalFilename,
    data.storedFilename,
    data.assetType,
    data.mimeType,
    data.fileSize,
    data.width ?? null,
    data.height ?? null,
    data.duration ?? null,
    data.storageProvider,
    data.storageBucket ?? null,
    data.storageReference,
    data.publicUrl,
    data.thumbnailUrl ?? null,
    altText,
    data.caption ?? null,
    data.copyright ?? null,
    focalPoint,
    folder,
    data.uploadedById ?? null,
    data.uploadedByEmail ?? null,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const query = `
    SELECT
      id,
      original_filename AS "originalFilename",
      stored_filename AS "storedFilename",
      asset_type AS "assetType",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      width,
      height,
      duration,
      storage_provider AS "storageProvider",
      storage_bucket AS "storageBucket",
      storage_reference AS "storageReference",
      public_url AS "publicUrl",
      thumbnail_url AS "thumbnailUrl",
      alt_text AS "altText",
      caption,
      copyright,
      focal_point AS "focalPoint",
      folder,
      uploaded_by_id AS "uploadedById",
      uploaded_by_email AS "uploadedByEmail",
      is_archived AS "isArchived",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM media_assets
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

export async function listMediaAssets(options: ListMediaOptions = {}): Promise<{ assets: MediaAsset[]; total: number }> {
  const pool = getDbPool();
  if (!pool) return { assets: [], total: 0 };

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options.isArchived !== undefined) {
    conditions.push(`is_archived = $${paramIdx++}`);
    params.push(options.isArchived);
  } else {
    // Default to active assets only
    conditions.push(`is_archived = FALSE`);
  }

  if (options.folder && options.folder !== 'all') {
    conditions.push(`folder = $${paramIdx++}`);
    params.push(options.folder);
  }

  if (options.assetType && options.assetType !== 'all') {
    conditions.push(`asset_type = $${paramIdx++}`);
    params.push(options.assetType);
  }

  if (options.search && options.search.trim()) {
    conditions.push(`(original_filename ILIKE $${paramIdx} OR alt_text ILIKE $${paramIdx} OR caption ILIKE $${paramIdx})`);
    params.push(`%${options.search.trim()}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sorting
  let orderBy = 'created_at DESC';
  if (options.sort === 'date_asc') orderBy = 'created_at ASC';
  else if (options.sort === 'name_asc') orderBy = 'original_filename ASC';
  else if (options.sort === 'name_desc') orderBy = 'original_filename DESC';
  else if (options.sort === 'size_desc') orderBy = 'file_size DESC';

  const countQuery = `SELECT COUNT(*) AS total FROM media_assets ${whereClause}`;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  let pagination = '';
  if (options.limit) {
    pagination += ` LIMIT ${options.limit}`;
    if (options.offset) pagination += ` OFFSET ${options.offset}`;
  }

  const query = `
    SELECT
      id,
      original_filename AS "originalFilename",
      stored_filename AS "storedFilename",
      asset_type AS "assetType",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      width,
      height,
      duration,
      storage_provider AS "storageProvider",
      storage_bucket AS "storageBucket",
      storage_reference AS "storageReference",
      public_url AS "publicUrl",
      thumbnail_url AS "thumbnailUrl",
      alt_text AS "altText",
      caption,
      copyright,
      focal_point AS "focalPoint",
      folder,
      uploaded_by_id AS "uploadedById",
      uploaded_by_email AS "uploadedByEmail",
      is_archived AS "isArchived",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM media_assets
    ${whereClause}
    ORDER BY ${orderBy}
    ${pagination}
  `;

  const { rows } = await pool.query(query, params);
  return { assets: rows, total };
}

export async function updateMediaAsset(
  id: string,
  patch: {
    altText?: string;
    caption?: string | null;
    copyright?: string | null;
    focalPoint?: string;
    folder?: string;
    thumbnailUrl?: string | null;
  }
): Promise<MediaAsset | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const sets: string[] = ['updated_at = NOW()'];
  const params: any[] = [id];
  let paramIdx = 2;

  if (patch.altText !== undefined) {
    sets.push(`alt_text = $${paramIdx++}`);
    params.push(patch.altText);
  }
  if (patch.caption !== undefined) {
    sets.push(`caption = $${paramIdx++}`);
    params.push(patch.caption);
  }
  if (patch.copyright !== undefined) {
    sets.push(`copyright = $${paramIdx++}`);
    params.push(patch.copyright);
  }
  if (patch.focalPoint !== undefined) {
    sets.push(`focal_point = $${paramIdx++}`);
    params.push(patch.focalPoint);
  }
  if (patch.folder !== undefined) {
    sets.push(`folder = $${paramIdx++}`);
    params.push(patch.folder);
  }
  if (patch.thumbnailUrl !== undefined) {
    sets.push(`thumbnail_url = $${paramIdx++}`);
    params.push(patch.thumbnailUrl);
  }

  const query = `
    UPDATE media_assets
    SET ${sets.join(', ')}
    WHERE id = $1
    RETURNING
      id,
      original_filename AS "originalFilename",
      stored_filename AS "storedFilename",
      asset_type AS "assetType",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      width,
      height,
      duration,
      storage_provider AS "storageProvider",
      storage_bucket AS "storageBucket",
      storage_reference AS "storageReference",
      public_url AS "publicUrl",
      thumbnail_url AS "thumbnailUrl",
      alt_text AS "altText",
      caption,
      copyright,
      focal_point AS "focalPoint",
      folder,
      uploaded_by_id AS "uploadedById",
      uploaded_by_email AS "uploadedByEmail",
      is_archived AS "isArchived",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}

export async function archiveMediaAsset(id: string, isArchived: boolean): Promise<MediaAsset | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const query = `
    UPDATE media_assets
    SET is_archived = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      original_filename AS "originalFilename",
      stored_filename AS "storedFilename",
      asset_type AS "assetType",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      width,
      height,
      duration,
      storage_provider AS "storageProvider",
      storage_bucket AS "storageBucket",
      storage_reference AS "storageReference",
      public_url AS "publicUrl",
      thumbnail_url AS "thumbnailUrl",
      alt_text AS "altText",
      caption,
      copyright,
      focal_point AS "focalPoint",
      folder,
      uploaded_by_id AS "uploadedById",
      uploaded_by_email AS "uploadedByEmail",
      is_archived AS "isArchived",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const { rows } = await pool.query(query, [id, isArchived]);
  return rows[0] || null;
}

/**
 * Reference Tracking: Discovers which CMS sections and historical CMS revisions reference this media asset.
 * Checks cms_sections (published content and draft_content) as well as cms_revisions (historical versions).
 */
export async function getMediaAssetUsage(assetId: string, publicUrl?: string): Promise<MediaUsageItem[]> {
  const pool = getDbPool();
  if (!pool) return [];

  const patternId = `%${assetId}%`;
  const patternUrl = publicUrl ? `%${publicUrl}%` : '';

  // 1. Current sections (published and draft)
  const sectionsQuery = `
    SELECT
      s.page_id AS "pageId",
      COALESCE(p.name, s.page_id) AS "pageName",
      s.section_key AS "sectionKey",
      (s.content::text LIKE $1 OR ($2 != '' AND s.content::text LIKE $2)) AS "inPublished",
      (s.draft_content IS NOT NULL AND (s.draft_content::text LIKE $1 OR ($2 != '' AND s.draft_content::text LIKE $2))) AS "inDraft",
      FALSE AS "inRevisionHistory"
    FROM cms_sections s
    LEFT JOIN cms_pages p ON s.page_id = p.id
    WHERE 
      (s.content::text LIKE $1 OR ($2 != '' AND s.content::text LIKE $2))
      OR (s.draft_content IS NOT NULL AND (s.draft_content::text LIKE $1 OR ($2 != '' AND s.draft_content::text LIKE $2)))
    ORDER BY s.page_id ASC, s.sort_order ASC
  `;

  // 2. Content revisions (historical versions)
  const revisionsQuery = `
    SELECT
      r.page_id AS "pageId",
      COALESCE(p.name, r.page_id) AS "pageName",
      CONCAT('Revision #', r.revision_number) AS "sectionKey",
      FALSE AS "inPublished",
      FALSE AS "inDraft",
      TRUE AS "inRevisionHistory"
    FROM cms_revisions r
    LEFT JOIN cms_pages p ON r.page_id = p.id
    WHERE (r.data::text LIKE $1 OR ($2 != '' AND r.data::text LIKE $2))
    ORDER BY r.page_id ASC, r.revision_number DESC
  `;

  try {
    const [sectionsRes, revisionsRes] = await Promise.all([
      pool.query(sectionsQuery, [patternId, patternUrl]),
      pool.query(revisionsQuery, [patternId, patternUrl]),
    ]);

    return [...sectionsRes.rows, ...revisionsRes.rows];
  } catch (err) {
    console.warn('[MediaRepo] getMediaAssetUsage query warning:', err);
    return [];
  }
}

/**
 * Permanently delete media asset record from the database.
 */
export async function deleteMediaAsset(id: string): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;

  const res = await pool.query('DELETE FROM media_assets WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

/**
 * Record media audit log in audit_logs
 */
export async function recordMediaAuditEvent(
  eventType: string,
  assetId: string,
  payload: Record<string, any>
): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, event_type, entity_type, entity_id, payload)
       VALUES ($1, $2, 'media_asset', $3, $4)`,
      [auditId, eventType, assetId, JSON.stringify(payload)]
    );
  } catch (err) {
    console.warn('[MediaRepo] recordMediaAuditEvent failed:', err);
  }
}
