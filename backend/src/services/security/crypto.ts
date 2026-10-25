import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte AES key from the mandatory ENCRYPTION_SECRET.
 * Refuses to proceed with hardcoded fallbacks in production.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || (process.env.NODE_ENV === 'test' ? process.env.TEST_ENCRYPTION_SECRET : undefined);
  if (!secret) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: Dedicated ENCRYPTION_SECRET environment variable is missing on backend. Refusing to operate encryption without dedicated secret.'
    );
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt sensitive plain text (e.g. OAuth tokens, refresh tokens) using AES-256-GCM
 */
export function encryptSecure(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (hex encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt cipher text encrypted with encryptSecure
 */
export function decryptSecure(cipherText: string): string {
  if (!cipherText) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload format.');
  }

  const [ivHex, tagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Generate cryptographically secure random token for appointment self-management
 * Uses 32 random bytes (64 hex characters) for high cryptographic entropy.
 */
export function generateManagementToken(): string {
  return `bk_${Date.now()}_${crypto.randomBytes(32).toString('hex')}`;
}
