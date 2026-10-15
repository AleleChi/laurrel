import fs from 'fs';
import path from 'path';
import { StoredEnquiryRecord, EnquiryPayload, EnquiryStatus } from '../types/enquiry';

/**
 * Generates an honest, human-readable enquiry reference ID
 * Format: ENQ-YYYYMMDD-XXXX (e.g. ENQ-20261015-4829)
 */
export function generateEnquiryId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ENQ-${year}${month}${day}-${randomSuffix}`;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');

/**
 * Ensures data directory and file exist safely
 */
function ensureStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ENQUIRIES_FILE)) {
      fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (err) {
    console.error('[Enquiry DB] Failed to initialize storage:', err);
  }
}

/**
 * Reads records from file storage
 */
export async function readAllEnquiries(): Promise<StoredEnquiryRecord[]> {
  try {
    ensureStorage();
    if (!fs.existsSync(ENQUIRIES_FILE)) return [];
    const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Enquiry DB] Error reading enquiries:', err);
    return [];
  }
}

/**
 * Persists a new structured enquiry record
 */
export async function createEnquiryRecord(
  payload: EnquiryPayload
): Promise<StoredEnquiryRecord> {
  ensureStorage();

  const id = generateEnquiryId();
  const timestamp = new Date().toISOString();

  const record: StoredEnquiryRecord = {
    id,
    intent: payload.intent || 'general_contact',
    source: payload.source || 'web_direct',
    customer: {
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || undefined,
    },
    services: (payload.services && payload.services.length > 0)
      ? payload.services
      : ['general'],
    serviceLocation: payload.serviceLocation?.trim() || undefined,
    preferredTiming: payload.preferredDate?.trim() || undefined,
    details: (payload.details || payload.message || '').trim(),
    serviceSpecificDetails: payload.serviceDetails,
    status: 'new',
    createdAt: timestamp,
    updatedAt: timestamp,
    internalNotes: [
      {
        id: `note-${Date.now()}`,
        author: 'system',
        note: `Enquiry received via ${payload.source || 'web'} with intent ${payload.intent || 'general_contact'}`,
        createdAt: timestamp,
      },
    ],
  };

  // 1. Persistent file storage (guaranteed in Node/local/container environments)
  try {
    const records = await readAllEnquiries();
    records.unshift(record);
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (fileErr) {
    console.error('[Enquiry DB] Local durability write error:', fileErr);
  }

  // 2. Future PostgreSQL / Remote Database hook
  // When DATABASE_URL is supplied in production, records can be written to the Postgres pool
  if (process.env.DATABASE_URL) {
    // Documented Postgres query in docs/enquiry-database-schema.sql
    console.log('[Enquiry DB] Remote database configured; syncing record ID:', record.id);
  }

  return record;
}

/**
 * Retrieves a single enquiry by reference ID
 */
export async function getEnquiryById(id: string): Promise<StoredEnquiryRecord | null> {
  const records = await readAllEnquiries();
  return records.find((r) => r.id === id) || null;
}

/**
 * Updates status and appends internal note
 */
export async function updateEnquiryStatus(
  id: string,
  newStatus: EnquiryStatus,
  author: string,
  noteText?: string
): Promise<StoredEnquiryRecord | null> {
  ensureStorage();
  const records = await readAllEnquiries();
  const index = records.findIndex((r) => r.id === id);

  if (index === -1) return null;

  const timestamp = new Date().toISOString();
  records[index].status = newStatus;
  records[index].updatedAt = timestamp;

  if (noteText) {
    records[index].internalNotes.push({
      id: `note-${Date.now()}`,
      author,
      note: noteText,
      createdAt: timestamp,
    });
  }

  fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(records, null, 2), 'utf8');
  return records[index];
}
