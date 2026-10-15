import fs from 'fs';
import path from 'path';
import { getDbPool } from './pool';

export interface CustomerContact {
  name: string;
  email: string;
  phone?: string;
}

export interface EnquiryRecord {
  id: string;
  intent: string;
  source: string;
  customer: CustomerContact;
  services: string[];
  serviceLocation?: string;
  preferredTiming?: string;
  details: string;
  serviceDetails?: any;
  status: 'new' | 'reviewed' | 'quoted' | 'scheduled' | 'closed';
  emailDelivered: boolean;
  createdAt: string;
  updatedAt: string;
  internalNotes?: Array<{
    id: string;
    author: string;
    note: string;
    createdAt: string;
  }>;
}

export interface AiHandoffRecord {
  id: string;
  sessionId?: string;
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  services?: string[];
  serviceLocation?: string;
  reason: string;
  status: 'pending' | 'contacted' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export function generateEnquiryId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ENQ-${year}${month}${day}-${randomSuffix}`;
}

// Fallback local file storage if PostgreSQL is not yet configured
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_ENQUIRIES_FILE = path.join(LOCAL_DATA_DIR, 'enquiries.json');
const LOCAL_HANDOFFS_FILE = path.join(LOCAL_DATA_DIR, 'ai_handoffs.json');

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
}

/**
 * Persists a new customer enquiry into PostgreSQL with resilient file fallback
 */
export async function createEnquiry(payload: {
  intent?: string;
  source?: string;
  name: string;
  email: string;
  phone?: string;
  services: string[];
  serviceLocation?: string;
  preferredDate?: string;
  details: string;
  serviceDetails?: any;
  emailDelivered?: boolean;
}): Promise<EnquiryRecord> {
  const id = generateEnquiryId();
  const now = new Date().toISOString();

  const record: EnquiryRecord = {
    id,
    intent: payload.intent || 'general_contact',
    source: payload.source || 'web_direct',
    customer: {
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || undefined,
    },
    services: payload.services && payload.services.length > 0 ? payload.services : ['general'],
    serviceLocation: payload.serviceLocation?.trim() || undefined,
    preferredTiming: payload.preferredDate?.trim() || undefined,
    details: payload.details.trim(),
    serviceDetails: payload.serviceDetails || null,
    status: 'new',
    emailDelivered: Boolean(payload.emailDelivered),
    createdAt: now,
    updatedAt: now,
    internalNotes: [
      {
        id: `note-${Date.now()}`,
        author: 'system',
        note: `Enquiry received via ${payload.source || 'web'} with intent ${payload.intent || 'general_contact'}`,
        createdAt: now,
      },
    ],
  };

  const pool = getDbPool();
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const insertQuery = `
          INSERT INTO enquiries (
            id, intent, source, customer_name, customer_email, customer_phone,
            services, service_location, preferred_timing, details, service_details,
            status, email_delivered, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;

        await client.query(insertQuery, [
          record.id,
          record.intent,
          record.source,
          record.customer.name,
          record.customer.email,
          record.customer.phone || null,
          record.services,
          record.serviceLocation || null,
          record.preferredTiming || null,
          record.details,
          record.serviceDetails ? JSON.stringify(record.serviceDetails) : null,
          record.status,
          record.emailDelivered,
          record.createdAt,
          record.updatedAt,
        ]);

        // Insert initial system note
        const noteQuery = `
          INSERT INTO enquiry_notes (id, enquiry_id, author, note, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(noteQuery, [
          `note-${Date.now()}`,
          record.id,
          'system',
          `Enquiry created via ${record.source}`,
          record.createdAt,
        ]);

        await client.query('COMMIT');
        return record;
      } catch (dbErr) {
        await client.query('ROLLBACK');
        console.error('[PostgreSQL createEnquiry Error]:', dbErr);
        // Fall back to local file
      } finally {
        client.release();
      }
    } catch (poolErr) {
      console.error('[PostgreSQL Pool Connection Error]:', poolErr);
    }
  }

  // Fallback to local persistence
  try {
    ensureLocalDir();
    let records: EnquiryRecord[] = [];
    if (fs.existsSync(LOCAL_ENQUIRIES_FILE)) {
      records = JSON.parse(fs.readFileSync(LOCAL_ENQUIRIES_FILE, 'utf8'));
    }
    records.unshift(record);
    fs.writeFileSync(LOCAL_ENQUIRIES_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (fileErr) {
    console.error('[Local file write error]:', fileErr);
  }

  return record;
}

/**
 * Updates delivery status of notification email
 */
export async function updateEmailDeliveryStatus(id: string, delivered: boolean): Promise<void> {
  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query('UPDATE enquiries SET email_delivered = $1, updated_at = NOW() WHERE id = $2', [delivered, id]);
      return;
    } catch (err) {
      console.warn('[PostgreSQL updateEmailDeliveryStatus Error]:', err);
    }
  }

  try {
    ensureLocalDir();
    if (fs.existsSync(LOCAL_ENQUIRIES_FILE)) {
      const records: EnquiryRecord[] = JSON.parse(fs.readFileSync(LOCAL_ENQUIRIES_FILE, 'utf8'));
      const idx = records.findIndex((r) => r.id === id);
      if (idx !== -1) {
        records[idx].emailDelivered = delivered;
        records[idx].updatedAt = new Date().toISOString();
        fs.writeFileSync(LOCAL_ENQUIRIES_FILE, JSON.stringify(records, null, 2), 'utf8');
      }
    }
  } catch (e) {}
}

/**
 * Retrieves enquiry by reference ID
 */
export async function getEnquiryById(id: string): Promise<EnquiryRecord | null> {
  const pool = getDbPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM enquiries WHERE id = $1', [id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const notesRes = await pool.query('SELECT * FROM enquiry_notes WHERE enquiry_id = $1 ORDER BY created_at ASC', [id]);

        return {
          id: row.id,
          intent: row.intent,
          source: row.source,
          customer: {
            name: row.customer_name,
            email: row.customer_email,
            phone: row.customer_phone || undefined,
          },
          services: row.services || [],
          serviceLocation: row.service_location || undefined,
          preferredTiming: row.preferred_timing || undefined,
          details: row.details,
          serviceDetails: row.service_details,
          status: row.status,
          emailDelivered: row.email_delivered,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          internalNotes: notesRes.rows.map((n: any) => ({
            id: n.id,
            author: n.author,
            note: n.note,
            createdAt: n.created_at,
          })),
        };
      }
    } catch (err) {
      console.error('[PostgreSQL getEnquiryById Error]:', err);
    }
  }

  try {
    ensureLocalDir();
    if (fs.existsSync(LOCAL_ENQUIRIES_FILE)) {
      const records: EnquiryRecord[] = JSON.parse(fs.readFileSync(LOCAL_ENQUIRIES_FILE, 'utf8'));
      return records.find((r) => r.id === id) || null;
    }
  } catch (e) {}

  return null;
}

/**
 * Lists enquiries with optional status or service filter
 */
export async function listEnquiries(filter?: { status?: string; service?: string; limit?: number }): Promise<EnquiryRecord[]> {
  const pool = getDbPool();
  const limit = filter?.limit || 50;

  if (pool) {
    try {
      let query = 'SELECT * FROM enquiries';
      const conditions: string[] = [];
      const values: any[] = [];

      if (filter?.status) {
        values.push(filter.status);
        conditions.push(`status = $${values.length}`);
      }

      if (filter?.service) {
        values.push(filter.service);
        conditions.push(`$${values.length} = ANY(services)`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      values.push(limit);
      query += ` ORDER BY created_at DESC LIMIT $${values.length}`;

      const res = await pool.query(query, values);
      return res.rows.map((row: any) => ({
        id: row.id,
        intent: row.intent,
        source: row.source,
        customer: {
          name: row.customer_name,
          email: row.customer_email,
          phone: row.customer_phone || undefined,
        },
        services: row.services || [],
        serviceLocation: row.service_location || undefined,
        preferredTiming: row.preferred_timing || undefined,
        details: row.details,
        serviceDetails: row.service_details,
        status: row.status,
        emailDelivered: row.email_delivered,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      console.error('[PostgreSQL listEnquiries Error]:', err);
    }
  }

  try {
    ensureLocalDir();
    if (fs.existsSync(LOCAL_ENQUIRIES_FILE)) {
      let records: EnquiryRecord[] = JSON.parse(fs.readFileSync(LOCAL_ENQUIRIES_FILE, 'utf8'));
      if (filter?.status) {
        records = records.filter((r) => r.status === filter.status);
      }
      if (filter?.service) {
        records = records.filter((r) => r.services.includes(filter.service!));
      }
      return records.slice(0, limit);
    }
  } catch (e) {}

  return [];
}

/**
 * Updates status of an enquiry and appends an administrative note
 */
export async function updateEnquiryStatus(
  id: string,
  newStatus: 'new' | 'reviewed' | 'quoted' | 'scheduled' | 'closed',
  author: string,
  noteText?: string
): Promise<EnquiryRecord | null> {
  const now = new Date().toISOString();
  const pool = getDbPool();

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE enquiries SET status = $1, updated_at = $2 WHERE id = $3', [newStatus, now, id]);

        if (noteText) {
          await client.query(
            'INSERT INTO enquiry_notes (id, enquiry_id, author, note, created_at) VALUES ($1, $2, $3, $4, $5)',
            [`note-${Date.now()}`, id, author, noteText, now]
          );
        }

        await client.query('COMMIT');
        return getEnquiryById(id);
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('[PostgreSQL updateEnquiryStatus Error]:', e);
      } finally {
        client.release();
      }
    } catch (poolErr) {
      console.error('[PostgreSQL Pool Error]:', poolErr);
    }
  }

  try {
    ensureLocalDir();
    if (fs.existsSync(LOCAL_ENQUIRIES_FILE)) {
      const records: EnquiryRecord[] = JSON.parse(fs.readFileSync(LOCAL_ENQUIRIES_FILE, 'utf8'));
      const idx = records.findIndex((r) => r.id === id);
      if (idx !== -1) {
        records[idx].status = newStatus;
        records[idx].updatedAt = now;
        if (noteText) {
          if (!records[idx].internalNotes) records[idx].internalNotes = [];
          records[idx].internalNotes!.push({
            id: `note-${Date.now()}`,
            author,
            note: noteText,
            createdAt: now,
          });
        }
        fs.writeFileSync(LOCAL_ENQUIRIES_FILE, JSON.stringify(records, null, 2), 'utf8');
        return records[idx];
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Records an AI Human Handoff request
 */
export async function createAiHandoff(payload: {
  sessionId?: string;
  name?: string;
  email: string;
  phone?: string;
  services?: string[];
  location?: string;
  reason: string;
}): Promise<AiHandoffRecord> {
  const id = `HO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const record: AiHandoffRecord = {
    id,
    sessionId: payload.sessionId,
    customerName: payload.name,
    customerEmail: payload.email,
    customerPhone: payload.phone,
    services: payload.services,
    serviceLocation: payload.location,
    reason: payload.reason,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const pool = getDbPool();
  if (pool) {
    try {
      const query = `
        INSERT INTO ai_handoffs (
          id, session_id, customer_name, customer_email, customer_phone,
          services, service_location, reason, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      await pool.query(query, [
        record.id,
        record.sessionId || null,
        record.customerName || null,
        record.customerEmail,
        record.customerPhone || null,
        record.services || null,
        record.serviceLocation || null,
        record.reason,
        record.status,
        record.createdAt,
        record.updatedAt,
      ]);
      return record;
    } catch (e) {
      console.error('[PostgreSQL createAiHandoff Error]:', e);
    }
  }

  try {
    ensureLocalDir();
    let records: AiHandoffRecord[] = [];
    if (fs.existsSync(LOCAL_HANDOFFS_FILE)) {
      records = JSON.parse(fs.readFileSync(LOCAL_HANDOFFS_FILE, 'utf8'));
    }
    records.unshift(record);
    fs.writeFileSync(LOCAL_HANDOFFS_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (e) {}

  return record;
}

/**
 * Lists AI handoff requests for administrator review
 */
export async function listAiHandoffs(status?: string): Promise<AiHandoffRecord[]> {
  const pool = getDbPool();
  if (pool) {
    try {
      let query = 'SELECT * FROM ai_handoffs';
      const values: any[] = [];
      if (status) {
        values.push(status);
        query += ' WHERE status = $1';
      }
      query += ' ORDER BY created_at DESC LIMIT 50';
      const res = await pool.query(query, values);
      return res.rows.map((row: any) => ({
        id: row.id,
        sessionId: row.session_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        services: row.services,
        serviceLocation: row.service_location,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (e) {
      console.error('[PostgreSQL listAiHandoffs Error]:', e);
    }
  }

  try {
    ensureLocalDir();
    if (fs.existsSync(LOCAL_HANDOFFS_FILE)) {
      let records: AiHandoffRecord[] = JSON.parse(fs.readFileSync(LOCAL_HANDOFFS_FILE, 'utf8'));
      if (status) records = records.filter((r) => r.status === status);
      return records;
    }
  } catch (e) {}

  return [];
}
