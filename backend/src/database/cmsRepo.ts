import { getDbPool } from './pool';
import { randomUUID } from 'crypto';

export interface CmsPage {
  id: string;
  name: string;
  slug: string;
  template: string;
  status: 'draft' | 'published' | 'scheduled';
  seo: Record<string, any>;
  currentRevisionId?: string;
  lastEditorId?: string;
  lastEditorEmail?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  sections?: CmsSection[];
}

export interface CmsSection {
  id: string;
  pageId: string;
  sectionKey: string;
  sectionType: string;
  sortOrder: number;
  content: Record<string, any>;
  draftContent?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsRevision {
  id: string;
  pageId: string;
  revisionNumber: number;
  data: {
    seo: Record<string, any>;
    sections: Record<string, any>;
  };
  isPublished: boolean;
  authorId?: string;
  authorEmail?: string;
  authorName?: string;
  notes?: string;
  createdAt: string;
}

export interface CmsSiteSettings {
  key: string;
  value: Record<string, any>;
  lastEditorId?: string;
  lastEditorEmail?: string;
  updatedAt: string;
}

export interface EditorInfo {
  id: string;
  email: string;
  name?: string;
}

/**
 * List all CMS pages with basic revision and publication metadata
 */
export async function listCmsPages(): Promise<CmsPage[]> {
  const pool = getDbPool();
  if (!pool) return [];

  const query = `
    SELECT 
      id, 
      name, 
      slug, 
      template, 
      status, 
      seo, 
      current_revision_id AS "currentRevisionId",
      last_editor_id AS "lastEditorId",
      last_editor_email AS "lastEditorEmail",
      created_at AS "createdAt",
      updated_at AS "updatedAt",
      published_at AS "publishedAt"
    FROM cms_pages
    ORDER BY 
      CASE 
        WHEN id = 'home' THEN 1
        WHEN id = 'about' THEN 2
        WHEN id = 'services' THEN 3
        WHEN id = 'contact' THEN 4
        ELSE 5 
      END,
      name ASC
  `;

  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Get single page by ID with all sections (includes draft_content for authorized editor)
 */
export async function getCmsPageById(id: string): Promise<CmsPage | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const pageQuery = `
    SELECT 
      id, 
      name, 
      slug, 
      template, 
      status, 
      seo, 
      current_revision_id AS "currentRevisionId",
      last_editor_id AS "lastEditorId",
      last_editor_email AS "lastEditorEmail",
      created_at AS "createdAt",
      updated_at AS "updatedAt",
      published_at AS "publishedAt"
    FROM cms_pages
    WHERE id = $1
  `;
  const pageResult = await pool.query(pageQuery, [id]);
  if (pageResult.rows.length === 0) return null;

  const page = pageResult.rows[0];

  const sectionsQuery = `
    SELECT 
      id,
      page_id AS "pageId",
      section_key AS "sectionKey",
      section_type AS "sectionType",
      sort_order AS "sortOrder",
      content,
      draft_content AS "draftContent",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM cms_sections
    WHERE page_id = $1
    ORDER BY sort_order ASC
  `;
  const sectionsResult = await pool.query(sectionsQuery, [id]);
  page.sections = sectionsResult.rows;

  return page;
}

/**
 * Get published page content by slug for public website consumption
 * (Never returns draft_content or unpublished revisions)
 */
export async function getPublishedPageBySlug(slug: string): Promise<{
  page: Omit<CmsPage, 'sections'>;
  sections: Record<string, any>;
} | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const normalizedSlug = slug === '' || slug === 'home' ? '/' : slug.startsWith('/') ? slug : `/${slug}`;

  const pageQuery = `
    SELECT 
      id, 
      name, 
      slug, 
      template, 
      status, 
      seo, 
      current_revision_id AS "currentRevisionId",
      published_at AS "publishedAt",
      updated_at AS "updatedAt"
    FROM cms_pages
    WHERE slug = $1 AND status = 'published'
  `;
  const pageResult = await pool.query(pageQuery, [normalizedSlug]);
  if (pageResult.rows.length === 0) return null;

  const page = pageResult.rows[0];

  const sectionsQuery = `
    SELECT 
      section_key AS "sectionKey",
      content
    FROM cms_sections
    WHERE page_id = $1
    ORDER BY sort_order ASC
  `;
  const sectionsResult = await pool.query(sectionsQuery, [page.id]);

  const sectionsMap: Record<string, any> = {};
  for (const row of sectionsResult.rows) {
    sectionsMap[row.sectionKey] = row.content;
  }

  return { page, sections: sectionsMap };
}

/**
 * Save draft revisions to cms_sections.draft_content without publishing
 */
export async function savePageDraft(
  pageId: string,
  sections: Record<string, any>,
  seo?: Record<string, any>,
  editor?: EditorInfo
): Promise<CmsPage | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify page exists
    const checkPage = await client.query('SELECT id, seo FROM cms_pages WHERE id = $1', [pageId]);
    if (checkPage.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    // Update SEO on page if provided
    if (seo) {
      const mergedSeo = { ...(checkPage.rows[0].seo || {}), ...seo };
      await client.query(
        `UPDATE cms_pages 
         SET seo = $1, 
             updated_at = NOW(), 
             last_editor_id = $2, 
             last_editor_email = $3
         WHERE id = $4`,
        [JSON.stringify(mergedSeo), editor?.id || null, editor?.email || null, pageId]
      );
    } else {
      await client.query(
        `UPDATE cms_pages 
         SET updated_at = NOW(), 
             last_editor_id = $1, 
             last_editor_email = $2
         WHERE id = $3`,
        [editor?.id || null, editor?.email || null, pageId]
      );
    }

    // Update draft_content for each section
    for (const [sectionKey, sectionDraft] of Object.entries(sections)) {
      await client.query(
        `UPDATE cms_sections
         SET draft_content = $1,
             updated_at = NOW()
         WHERE page_id = $2 AND section_key = $3`,
        [JSON.stringify(sectionDraft), pageId, sectionKey]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getCmsPageById(pageId);
}

/**
 * Transactionally publish draft content to live website:
 * 1. Copies draft_content -> content (or uses provided sections directly)
 * 2. Clears draft_content
 * 3. Creates immutable revision snapshot in cms_revisions
 * 4. Updates cms_pages.current_revision_id, published_at, status='published'
 * 5. Logs publishing event to audit_logs
 */
export async function publishPage(
  pageId: string,
  editor: EditorInfo,
  notes?: string
): Promise<{ success: boolean; page: CmsPage; revision: CmsRevision }> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current page
    const pageRes = await client.query('SELECT * FROM cms_pages WHERE id = $1 FOR UPDATE', [pageId]);
    if (pageRes.rows.length === 0) {
      throw new Error(`Page '${pageId}' does not exist.`);
    }
    const pageRow = pageRes.rows[0];

    // 2. Fetch sections and commit draft_content -> content
    const sectionsRes = await client.query(
      'SELECT id, section_key, content, draft_content FROM cms_sections WHERE page_id = $1 ORDER BY sort_order ASC',
      [pageId]
    );

    const snapshotSections: Record<string, any> = {};

    for (const sec of sectionsRes.rows) {
      // If there is draft content, promote it to published content; otherwise retain current content
      const publishedContent = sec.draft_content !== null ? sec.draft_content : sec.content;
      snapshotSections[sec.section_key] = publishedContent;

      await client.query(
        `UPDATE cms_sections 
         SET content = $1,
             draft_content = NULL,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(publishedContent), sec.id]
      );
    }

    // 3. Compute next revision number
    const revCountRes = await client.query(
      'SELECT COALESCE(MAX(revision_number), 0) + 1 AS next_rev FROM cms_revisions WHERE page_id = $1',
      [pageId]
    );
    const nextRevisionNumber = parseInt(revCountRes.rows[0].next_rev, 10);
    const revisionId = `rev_${pageId}_${nextRevisionNumber}_${Date.now()}`;

    const snapshotData = {
      seo: pageRow.seo || {},
      sections: snapshotSections,
    };

    // 4. Insert revision snapshot
    const revInsertRes = await client.query(
      `INSERT INTO cms_revisions (
        id, 
        page_id, 
        revision_number, 
        data, 
        is_published, 
        author_id, 
        author_email, 
        author_name, 
        notes
      ) VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7, $8)
      RETURNING 
        id, 
        page_id AS "pageId", 
        revision_number AS "revisionNumber", 
        data, 
        is_published AS "isPublished", 
        author_id AS "authorId", 
        author_email AS "authorEmail", 
        author_name AS "authorName", 
        notes, 
        created_at AS "createdAt"`,
      [
        revisionId,
        pageId,
        nextRevisionNumber,
        JSON.stringify(snapshotData),
        editor.id,
        editor.email,
        editor.name || editor.email,
        notes || `Published revision #${nextRevisionNumber}`,
      ]
    );
    const createdRevision: CmsRevision = revInsertRes.rows[0];

    // 5. Update page metadata
    await client.query(
      `UPDATE cms_pages
       SET status = 'published',
           published_at = NOW(),
           updated_at = NOW(),
           current_revision_id = $1,
           last_editor_id = $2,
           last_editor_email = $3
       WHERE id = $4`,
      [revisionId, editor.id, editor.email, pageId]
    );

    // 6. Record audit log
    const auditId = `aud_${Date.now()}_${randomUUID().slice(0, 8)}`;
    await client.query(
      `INSERT INTO audit_logs (id, event_type, entity_type, entity_id, payload)
       VALUES ($1, 'cms.page.published', 'cms_page', $2, $3)`,
      [
        auditId,
        pageId,
        JSON.stringify({
          revisionNumber: nextRevisionNumber,
          revisionId,
          editorEmail: editor.email,
          notes,
        }),
      ]
    );

    await client.query('COMMIT');

    const updatedPage = await getCmsPageById(pageId);
    if (!updatedPage) throw new Error('Failed to retrieve updated page.');

    return {
      success: true,
      page: updatedPage,
      revision: createdRevision,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List all revisions for a page
 */
export async function getPageRevisions(pageId: string): Promise<CmsRevision[]> {
  const pool = getDbPool();
  if (!pool) return [];

  const query = `
    SELECT 
      id,
      page_id AS "pageId",
      revision_number AS "revisionNumber",
      data,
      is_published AS "isPublished",
      author_id AS "authorId",
      author_email AS "authorEmail",
      author_name AS "authorName",
      notes,
      created_at AS "createdAt"
    FROM cms_revisions
    WHERE page_id = $1
    ORDER BY revision_number DESC
  `;

  const { rows } = await pool.query(query, [pageId]);
  return rows;
}

/**
 * Restore a past revision snapshot
 */
export async function restorePageRevision(
  pageId: string,
  revisionNumber: number,
  editor: EditorInfo
): Promise<{ success: boolean; page: CmsPage; revision: CmsRevision }> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch target revision
    const targetRevRes = await client.query(
      'SELECT * FROM cms_revisions WHERE page_id = $1 AND revision_number = $2',
      [pageId, revisionNumber]
    );
    if (targetRevRes.rows.length === 0) {
      throw new Error(`Revision #${revisionNumber} does not exist for page '${pageId}'.`);
    }

    const targetRev = targetRevRes.rows[0];
    const snapshotData = targetRev.data;
    const snapshotSections = snapshotData.sections || {};
    const snapshotSeo = snapshotData.seo || {};

    // 2. Restore sections
    for (const [sectionKey, content] of Object.entries(snapshotSections)) {
      await client.query(
        `UPDATE cms_sections
         SET content = $1,
             draft_content = NULL,
             updated_at = NOW()
         WHERE page_id = $2 AND section_key = $3`,
        [JSON.stringify(content), pageId, sectionKey]
      );
    }

    // 3. Compute next revision number for this restoration
    const revCountRes = await client.query(
      'SELECT COALESCE(MAX(revision_number), 0) + 1 AS next_rev FROM cms_revisions WHERE page_id = $1',
      [pageId]
    );
    const nextRevisionNumber = parseInt(revCountRes.rows[0].next_rev, 10);
    const newRevisionId = `rev_${pageId}_${nextRevisionNumber}_restore_${Date.now()}`;

    // 4. Create new revision record denoting restoration
    const revInsertRes = await client.query(
      `INSERT INTO cms_revisions (
        id, 
        page_id, 
        revision_number, 
        data, 
        is_published, 
        author_id, 
        author_email, 
        author_name, 
        notes
      ) VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7, $8)
      RETURNING 
        id, 
        page_id AS "pageId", 
        revision_number AS "revisionNumber", 
        data, 
        is_published AS "isPublished", 
        author_id AS "authorId", 
        author_email AS "authorEmail", 
        author_name AS "authorName", 
        notes, 
        created_at AS "createdAt"`,
      [
        newRevisionId,
        pageId,
        nextRevisionNumber,
        JSON.stringify(snapshotData),
        editor.id,
        editor.email,
        editor.name || editor.email,
        `Restored from revision #${revisionNumber}`,
      ]
    );
    const restoredRevision: CmsRevision = revInsertRes.rows[0];

    // 5. Update page
    await client.query(
      `UPDATE cms_pages
       SET seo = $1,
           status = 'published',
           published_at = NOW(),
           updated_at = NOW(),
           current_revision_id = $2,
           last_editor_id = $3,
           last_editor_email = $4
       WHERE id = $5`,
      [JSON.stringify(snapshotSeo), newRevisionId, editor.id, editor.email, pageId]
    );

    // 6. Record audit log
    const auditId = `aud_${Date.now()}_${randomUUID().slice(0, 8)}`;
    await client.query(
      `INSERT INTO audit_logs (id, event_type, entity_type, entity_id, payload)
       VALUES ($1, 'cms.page.restored', 'cms_page', $2, $3)`,
      [
        auditId,
        pageId,
        JSON.stringify({
          restoredFromRevisionNumber: revisionNumber,
          newRevisionNumber: nextRevisionNumber,
          editorEmail: editor.email,
        }),
      ]
    );

    await client.query('COMMIT');

    const updatedPage = await getCmsPageById(pageId);
    if (!updatedPage) throw new Error('Failed to retrieve restored page.');

    return {
      success: true,
      page: updatedPage,
      revision: restoredRevision,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get Site Settings
 */
export async function getSiteSettings(key?: string): Promise<Record<string, any>> {
  const pool = getDbPool();
  if (!pool) return {};

  if (key) {
    const res = await pool.query('SELECT value FROM cms_site_settings WHERE key = $1', [key]);
    return res.rows.length > 0 ? res.rows[0].value : {};
  }

  const res = await pool.query('SELECT key, value FROM cms_site_settings');
  const settings: Record<string, any> = {};
  for (const row of res.rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

/**
 * Update Site Settings
 */
export async function updateSiteSettings(
  key: string,
  value: Record<string, any>,
  editor?: EditorInfo
): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  await pool.query(
    `INSERT INTO cms_site_settings (key, value, last_editor_id, last_editor_email, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value,
         last_editor_id = EXCLUDED.last_editor_id,
         last_editor_email = EXCLUDED.last_editor_email,
         updated_at = NOW()`,
    [key, JSON.stringify(value), editor?.id || null, editor?.email || null]
  );
}
