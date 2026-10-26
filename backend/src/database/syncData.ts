import fs from 'fs';
import path from 'path';
import { getDbPool } from './pool';

export async function syncHistoricalEnquiries(): Promise<{ synced: number; notes: number }> {
  // Prevent unintended import of historical customer records into schema-only staging environments
  if (process.env.SYNC_HISTORICAL_ENQUIRIES === 'false' || process.env.STAGING_SCHEMA_ONLY === 'true') {
    console.log('[Sync] Skipping historical enquiry synchronization (SCHEMA_ONLY / SYNC_HISTORICAL_ENQUIRIES=false active).');
    return { synced: 0, notes: 0 };
  }

  const pool = getDbPool();
  if (!pool) {
    console.warn('[Sync] No database connection available.');
    return { synced: 0, notes: 0 };
  }

  const candidatePaths = [
    path.join(process.cwd(), 'data', 'enquiries.json'),
    path.join(__dirname, '..', '..', '..', 'data', 'enquiries.json'),
    path.join(__dirname, '..', '..', 'data', 'enquiries.json'),
  ];

  const dataPath = candidatePaths.find((p) => fs.existsSync(p));
  if (!dataPath) {
    console.log('[Sync] No data/enquiries.json file found to sync.');
    return { synced: 0, notes: 0 };
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  let items: any[] = [];
  try {
    items = JSON.parse(raw);
  } catch (err) {
    console.error('[Sync] Failed to parse data/enquiries.json:', err);
    return { synced: 0, notes: 0 };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { synced: 0, notes: 0 };
  }

  let syncedCount = 0;
  let notesCount = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of items) {
      if (!item.id || !item.customer?.email) continue;

      const customerName = item.customer.name || 'Anonymous Visitor';
      const customerEmail = item.customer.email.toLowerCase().trim();
      const customerPhone = item.customer.phone || null;
      const intent = item.intent || 'general_contact';
      const source = item.source || 'web_direct';
      const services = Array.isArray(item.services) && item.services.length > 0 ? item.services : ['general'];
      const location = item.serviceLocation || null;
      const timing = item.preferredTiming || null;
      const details = item.details || 'No details provided';
      const serviceDetails = item.serviceDetails ? JSON.stringify(item.serviceDetails) : null;
      const status = item.status || 'new';
      const emailDelivered = item.emailDelivered === true;
      const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
      const updatedAt = item.updatedAt ? new Date(item.updatedAt) : createdAt;

      const res = await client.query(
        `INSERT INTO enquiries (
          id, intent, source, customer_name, customer_email, customer_phone,
          services, service_location, preferred_timing, details, service_details,
          status, email_delivered, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
        RETURNING id`,
        [
          item.id,
          intent,
          source,
          customerName,
          customerEmail,
          customerPhone,
          services,
          location,
          timing,
          details,
          serviceDetails,
          status,
          emailDelivered,
          createdAt,
          updatedAt,
        ]
      );

      if (res.rowCount && res.rowCount > 0) {
        syncedCount++;
      }

      // Sync internal notes
      if (Array.isArray(item.internalNotes) && item.internalNotes.length > 0) {
        for (const note of item.internalNotes) {
          const noteId = note.id || `note-${item.id}-${Math.random().toString(36).substring(2, 8)}`;
          const author = note.author || 'system';
          const text = note.note || '';
          const noteCreated = note.createdAt ? new Date(note.createdAt) : createdAt;

          if (!text) continue;

          const nRes = await client.query(
            `INSERT INTO enquiry_notes (id, enquiry_id, author, note, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING
             RETURNING id`,
            [noteId, item.id, author, text, noteCreated]
          );

          if (nRes.rowCount && nRes.rowCount > 0) {
            notesCount++;
          }
        }
      }

      // If item is a human handoff, sync to ai_handoffs table if not already present
      if (intent === 'human_handoff') {
        const handoffId = `handoff-${item.id}`;
        await client.query(
          `INSERT INTO ai_handoffs (
            id, session_id, customer_name, customer_email, customer_phone,
            services, service_location, reason, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING`,
          [
            handoffId,
            item.sessionId || null,
            customerName,
            customerEmail,
            customerPhone,
            services,
            location,
            details,
            status === 'closed' ? 'resolved' : 'pending',
            createdAt,
            updatedAt,
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`[Sync] Successfully synced ${syncedCount} enquiries and ${notesCount} notes into Neon database.`);
    return { synced: syncedCount, notes: notesCount };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Sync Error]:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Standalone CLI execution
if (require.main === module) {
  syncHistoricalEnquiries()
    .then((res) => {
      console.log('[Sync Complete]:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Sync Failed]:', err);
      process.exit(1);
    });
}
