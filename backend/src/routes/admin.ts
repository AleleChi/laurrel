import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../middleware/auth';
import {
  listEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  listAiHandoffs,
} from '../database/enquiryRepo';

export const adminRouter = Router();

// Apply authentication to all admin routes
adminRouter.use('/api/admin', requireAdminAuth);

/**
 * GET /api/admin/stats - High-level metrics for dashboard
 */
adminRouter.get('/api/admin/stats', async (_req: Request, res: Response) => {
  try {
    const all = await listEnquiries({ limit: 500 });
    const handoffs = await listAiHandoffs();

    const newEnquiries = all.filter((e) => e.status === 'new').length;
    const reviewed = all.filter((e) => e.status === 'reviewed').length;
    const scheduled = all.filter((e) => e.status === 'scheduled').length;
    const failedDeliveries = all.filter((e) => !e.emailDelivered).length;
    const pendingHandoffs = handoffs.filter((h) => h.status === 'pending').length;

    res.status(200).json({
      totalEnquiries: all.length,
      newEnquiries,
      reviewed,
      scheduled,
      failedDeliveries,
      pendingHandoffs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/enquiries - List enquiries with optional status or service filter
 */
adminRouter.get('/api/admin/enquiries', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const service = req.query.service as string | undefined;
    const limit = parseInt((req.query.limit as string) || '50', 10);

    const enquiries = await listEnquiries({ status, service, limit });
    res.status(200).json({ enquiries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/enquiries/:id - Fetch single enquiry with internal notes
 */
adminRouter.get('/api/admin/enquiries/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const enquiry = await getEnquiryById(id);
    if (!enquiry) {
      res.status(404).json({ error: 'Enquiry not found' });
      return;
    }
    res.status(200).json({ enquiry });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/enquiries/:id/status - Update enquiry status & record internal note
 */
adminRouter.patch('/api/admin/enquiries/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note, author } = req.body;
    const allowed = ['new', 'reviewed', 'quoted', 'scheduled', 'closed'];

    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await updateEnquiryStatus(
      id,
      status,
      author || 'admin',
      note || undefined
    );


    if (!updated) {
      res.status(404).json({ error: 'Enquiry not found' });
      return;
    }

    res.status(200).json({ success: true, enquiry: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/handoffs - Review AI human handoff requests
 */
adminRouter.get('/api/admin/handoffs', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const handoffs = await listAiHandoffs(status);
    res.status(200).json({ handoffs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
