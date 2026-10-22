import { Router, Request, Response } from 'express';
import { requireAdminAuth, requireRole } from '../middleware/auth';
import {
  listCmsPages,
  getCmsPageById,
  getPublishedPageBySlug,
  savePageDraft,
  publishPage,
  getPageRevisions,
  restorePageRevision,
  getSiteSettings,
  updateSiteSettings,
} from '../database/cmsRepo';

export const cmsRouter = Router();

// ============================================================================
// HELPER: Input Sanitization & Safety
// ============================================================================

function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;
  // Disallow javascript: and unsafe script tags
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript\s*:/gi, 'unsafe-javascript:')
    .replace(/onload\s*=/gi, 'data-disabled-onload=')
    .replace(/onerror\s*=/gi, 'data-disabled-onerror=');
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = sanitizeObject(v);
    }
    return clean;
  }
  return obj;
}

// ============================================================================
// PUBLIC READ-ONLY ENDPOINTS (For Public Website Frontend)
// ============================================================================

/**
 * GET /api/public/content/:slug
 * Retrieves published content for a page (Never returns drafts or unpublished revisions)
 */
cmsRouter.get('/api/public/content/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await getPublishedPageBySlug(slug);

    if (!data) {
      res.status(404).json({ error: `Page with slug '${slug}' not found or not yet published.` });
      return;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('[Public Content Error]:', err.message);
    res.status(500).json({ error: 'Failed to retrieve published page content.' });
  }
});

/**
 * GET /api/public/settings
 * Retrieves public site settings
 */
cmsRouter.get('/api/public/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await getSiteSettings();
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (err: any) {
    console.error('[Public Settings Error]:', err.message);
    res.status(500).json({ error: 'Failed to retrieve public settings.' });
  }
});

// ============================================================================
// ADMIN CMS PROTECTED ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/cms/pages
 * List all pages
 */
cmsRouter.get(
  '/api/admin/cms/pages',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor', 'operations_staff', 'viewer']),
  async (_req: Request, res: Response) => {
    try {
      const pages = await listCmsPages();
      res.status(200).json({ success: true, pages });
    } catch (err: any) {
      console.error('[Admin CMS Pages Error]:', err.message);
      res.status(500).json({ error: 'Failed to retrieve CMS pages.' });
    }
  }
);

/**
 * GET /api/admin/cms/pages/:id
 * Retrieve single page with all sections (includes draftContent for editing)
 */
cmsRouter.get(
  '/api/admin/cms/pages/:id',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor', 'operations_staff', 'viewer']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const page = await getCmsPageById(id);

      if (!page) {
        res.status(404).json({ error: `Page '${id}' not found.` });
        return;
      }

      res.status(200).json({ success: true, page });
    } catch (err: any) {
      console.error('[Admin CMS Page Details Error]:', err.message);
      res.status(500).json({ error: 'Failed to retrieve page details.' });
    }
  }
);

/**
 * PATCH /api/admin/cms/pages/:id/draft
 * Save draft revisions to cms_sections.draft_content without publishing
 * Allowed roles: owner, admin, content_editor
 */
cmsRouter.patch(
  '/api/admin/cms/pages/:id/draft',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { sections, seo } = req.body;

      if (!sections || typeof sections !== 'object') {
        res.status(400).json({ error: 'Invalid payload: sections dictionary is required.' });
        return;
      }

      // Sanitize inputs
      const cleanSections = sanitizeObject(sections);
      const cleanSeo = seo ? sanitizeObject(seo) : undefined;

      const editor = req.adminUser
        ? {
            id: req.adminUser.id,
            email: req.adminUser.email,
            name: req.adminUser.name,
          }
        : {
            id: 'admin',
            email: 'admin@laurrelservices.ca',
            name: 'Administrator',
          };

      const updatedPage = await savePageDraft(id, cleanSections, cleanSeo, editor);

      if (!updatedPage) {
        res.status(404).json({ error: `Page '${id}' not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Draft saved successfully.',
        page: updatedPage,
      });
    } catch (err: any) {
      console.error('[Admin CMS Draft Error]:', err.message);
      res.status(500).json({ error: 'Failed to save draft changes.' });
    }
  }
);

/**
 * POST /api/admin/cms/pages/:id/publish
 * Transactionally promote draft to published content and create immutable revision snapshot
 * Allowed roles: owner, admin only (content_editor and viewer forbidden!)
 */
cmsRouter.post(
  '/api/admin/cms/pages/:id/publish',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body || {};

      const editor = req.adminUser
        ? {
            id: req.adminUser.id,
            email: req.adminUser.email,
            name: req.adminUser.name,
          }
        : {
            id: 'admin',
            email: 'admin@laurrelservices.ca',
            name: 'Administrator',
          };

      const result = await publishPage(id, editor, notes ? sanitizeString(notes) : undefined);

      res.status(200).json({
        success: true,
        message: `Page '${id}' published successfully as revision #${result.revision.revisionNumber}.`,
        page: result.page,
        revision: result.revision,
      });
    } catch (err: any) {
      console.error('[Admin CMS Publish Error]:', err.message);
      res.status(500).json({ error: err.message || 'Failed to publish page changes.' });
    }
  }
);

/**
 * GET /api/admin/cms/pages/:id/revisions
 * List all revisions for a page
 */
cmsRouter.get(
  '/api/admin/cms/pages/:id/revisions',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor', 'operations_staff', 'viewer']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const revisions = await getPageRevisions(id);

      res.status(200).json({
        success: true,
        pageId: id,
        revisions,
      });
    } catch (err: any) {
      console.error('[Admin CMS Revisions Error]:', err.message);
      res.status(500).json({ error: 'Failed to retrieve page revision history.' });
    }
  }
);

/**
 * POST /api/admin/cms/pages/:id/restore
 * Restore a past revision snapshot
 * Allowed roles: owner, admin only
 */
cmsRouter.post(
  '/api/admin/cms/pages/:id/restore',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { revisionNumber } = req.body;

      if (typeof revisionNumber !== 'number' || revisionNumber < 1) {
        res.status(400).json({ error: 'Valid revisionNumber is required.' });
        return;
      }

      const editor = req.adminUser
        ? {
            id: req.adminUser.id,
            email: req.adminUser.email,
            name: req.adminUser.name,
          }
        : {
            id: 'admin',
            email: 'admin@laurrelservices.ca',
            name: 'Administrator',
          };

      const result = await restorePageRevision(id, revisionNumber, editor);

      res.status(200).json({
        success: true,
        message: `Successfully restored revision #${revisionNumber} for page '${id}'.`,
        page: result.page,
        revision: result.revision,
      });
    } catch (err: any) {
      console.error('[Admin CMS Restore Error]:', err.message);
      res.status(500).json({ error: err.message || 'Failed to restore revision.' });
    }
  }
);

/**
 * GET /api/admin/cms/settings
 * Retrieve Site Settings
 */
cmsRouter.get(
  '/api/admin/cms/settings',
  requireAdminAuth,
  requireRole(['owner', 'admin', 'content_editor', 'operations_staff', 'viewer']),
  async (_req: Request, res: Response) => {
    try {
      const settings = await getSiteSettings();
      res.status(200).json({ success: true, settings });
    } catch (err: any) {
      console.error('[Admin CMS Settings Error]:', err.message);
      res.status(500).json({ error: 'Failed to retrieve site settings.' });
    }
  }
);

/**
 * PATCH /api/admin/cms/settings/:key
 * Update Site Settings
 * Allowed roles: owner, admin only
 */
cmsRouter.patch(
  '/api/admin/cms/settings/:key',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (!value || typeof value !== 'object') {
        res.status(400).json({ error: 'Settings value object is required.' });
        return;
      }

      const editor = req.adminUser
        ? {
            id: req.adminUser.id,
            email: req.adminUser.email,
          }
        : undefined;

      const cleanValue = sanitizeObject(value);
      await updateSiteSettings(key, cleanValue, editor);

      res.status(200).json({
        success: true,
        message: `Settings for '${key}' updated successfully.`,
      });
    } catch (err: any) {
      console.error('[Admin CMS Update Settings Error]:', err.message);
      res.status(500).json({ error: 'Failed to update site settings.' });
    }
  }
);
