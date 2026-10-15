import { EnquiryPayload, ServiceCategory } from '../types/enquiry';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnquiry(payload: Partial<EnquiryPayload>): ValidationResult {
  const errors: Record<string, string> = {};

  // Honeypot detection
  if (
    (payload.website && payload.website.trim().length > 0) ||
    (payload._hp_company && payload._hp_company.trim().length > 0)
  ) {
    errors._bot = 'Automated submission rejected.';
    return { isValid: false, errors };
  }

  // Name validation
  const name = payload.name?.trim() || '';
  if (!name || name.length < 2) {
    errors.name = 'Please provide your full name (at least 2 characters).';
  } else if (name.length > 100) {
    errors.name = 'Name must not exceed 100 characters.';
  }

  // Email validation
  const email = payload.email?.trim() || '';
  if (!email) {
    errors.email = 'Please provide an email address.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address (e.g. name@example.com).';
  }

  // Phone validation (optional)
  const phone = payload.phone?.trim() || '';
  if (phone && phone.length > 30) {
    errors.phone = 'Phone number must not exceed 30 characters.';
  }

  const intent = payload.intent || 'general_contact';

  // Service selection validation for quote requests and service sidebars
  if (intent === 'quote_request' || intent === 'service_sidebar') {
    const services = payload.services || [];
    if (!services || services.length === 0) {
      errors.services = 'Please select at least one service category.';
    }
  }

  // Service location / postal code is required for quote requests
  if (intent === 'quote_request') {
    const location = payload.serviceLocation?.trim() || '';
    if (!location || location.length < 2) {
      errors.serviceLocation = 'Please provide the service location or postal code.';
    }
  }

  // Message / details validation
  const details = (payload.details || payload.message || '').trim();
  if (!details || details.length < 5) {
    errors.details =
      intent === 'quote_request'
        ? 'Please describe the details of the job (at least 5 characters).'
        : 'Please share a few details about what you need (at least 5 characters).';
  } else if (details.length > 3000) {
    errors.details = 'Details must not exceed 3,000 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
