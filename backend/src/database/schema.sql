-- =========================================================
-- LAURREL SERVICES — POSTGRESQL PRODUCTION DATABASE SCHEMA
-- =========================================================

-- 1. Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id VARCHAR(32) PRIMARY KEY,
    intent VARCHAR(64) NOT NULL DEFAULT 'general_contact',
    source VARCHAR(64) NOT NULL DEFAULT 'web_direct',
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    services TEXT[] NOT NULL DEFAULT '{"general"}',
    service_location VARCHAR(255),
    preferred_timing VARCHAR(255),
    details TEXT NOT NULL,
    service_details JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'new',
    email_delivered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient enquiry querying and lead management
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(customer_email);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_source ON enquiries(source);

-- 2. Internal Administrative Notes Table
CREATE TABLE IF NOT EXISTS enquiry_notes (
    id VARCHAR(64) PRIMARY KEY,
    enquiry_id VARCHAR(32) NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    author VARCHAR(128) NOT NULL DEFAULT 'system',
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiry_notes_enquiry_id ON enquiry_notes(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_notes_created_at ON enquiry_notes(created_at DESC);

-- 3. AI Assistant Human Handoffs Table
CREATE TABLE IF NOT EXISTS ai_handoffs (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(128),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    services TEXT[],
    service_location VARCHAR(255),
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_handoffs_status ON ai_handoffs(status);
CREATE INDEX IF NOT EXISTS idx_ai_handoffs_email ON ai_handoffs(customer_email);
CREATE INDEX IF NOT EXISTS idx_ai_handoffs_created_at ON ai_handoffs(created_at DESC);

-- 4. Billing Quotations Table (Domain Model Preserved)
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(32) PRIMARY KEY,
    enquiry_id VARCHAR(32) REFERENCES enquiries(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_address VARCHAR(255),
    line_items JSONB NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1300,
    tax_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    status VARCHAR(32) NOT NULL DEFAULT 'pending_approval',
    valid_until TIMESTAMPTZ NOT NULL,
    admin_approved_by VARCHAR(128),
    admin_approved_at TIMESTAMPTZ,
    customer_accepted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_enquiry ON quotes(enquiry_id);

-- 5. Billing Invoices Table (Domain Model Preserved)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(32) PRIMARY KEY,
    quote_id VARCHAR(32) REFERENCES quotes(id) ON DELETE SET NULL,
    enquiry_id VARCHAR(32) REFERENCES enquiries(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_address VARCHAR(255),
    line_items JSONB NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1300,
    tax_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    status VARCHAR(32) NOT NULL DEFAULT 'pending_approval',
    payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
    payment_provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
    provider_invoice_id VARCHAR(128),
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    admin_approved_by VARCHAR(128),
    admin_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);

-- 6. Audit & Webhook Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 7. Administrator Accounts Table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'admin', -- 'owner', 'admin', 'content_editor', 'operations_staff', 'viewer'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    password_reset_token VARCHAR(128),
    password_reset_expires TIMESTAMPTZ,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 8. Administrator Sessions Table (Server-managed session revocation)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- 9. Administrator Auth Audit Events Table
CREATE TABLE IF NOT EXISTS admin_auth_events (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_auth_events_email ON admin_auth_events(email);
CREATE INDEX IF NOT EXISTS idx_admin_auth_events_created_at ON admin_auth_events(created_at DESC);

-- =========================================================
-- 10. CMS DATA MODEL (MODULE 02)
-- =========================================================

-- Pages table
CREATE TABLE IF NOT EXISTS cms_pages (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    template VARCHAR(64) NOT NULL DEFAULT 'standard',
    status VARCHAR(32) NOT NULL DEFAULT 'published', -- 'draft', 'published', 'scheduled'
    seo JSONB NOT NULL DEFAULT '{}',
    current_revision_id VARCHAR(64),
    last_editor_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
    last_editor_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON cms_pages(status);

-- Page Sections table
CREATE TABLE IF NOT EXISTS cms_sections (
    id VARCHAR(64) PRIMARY KEY,
    page_id VARCHAR(64) NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
    section_key VARCHAR(64) NOT NULL,
    section_type VARCHAR(64) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    content JSONB NOT NULL,
    draft_content JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(page_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_cms_sections_page_id ON cms_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_sections_sort_order ON cms_sections(page_id, sort_order);

-- Content Revisions table (Version history, transactional publishing, rollback)
CREATE TABLE IF NOT EXISTS cms_revisions (
    id VARCHAR(64) PRIMARY KEY,
    page_id VARCHAR(64) NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
    revision_number INT NOT NULL,
    data JSONB NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    author_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
    author_email VARCHAR(255),
    author_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(page_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_cms_revisions_page_id ON cms_revisions(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_revisions_created_at ON cms_revisions(created_at DESC);

-- Site Settings table
CREATE TABLE IF NOT EXISTS cms_site_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    last_editor_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
    last_editor_email VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 11. MEDIA LIBRARY DATA MODEL (MODULE 03)
-- =========================================================

CREATE TABLE IF NOT EXISTS media_assets (
    id VARCHAR(64) PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    asset_type VARCHAR(32) NOT NULL DEFAULT 'image', -- 'image', 'video', 'document'
    mime_type VARCHAR(128) NOT NULL,
    file_size BIGINT NOT NULL,
    width INT,
    height INT,
    duration NUMERIC(8, 2), -- in seconds, for videos
    storage_provider VARCHAR(32) NOT NULL DEFAULT 'local', -- 'local', 'r2', 'cloudinary'
    storage_bucket VARCHAR(128),
    storage_reference TEXT NOT NULL,
    public_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT NOT NULL DEFAULT '',
    caption TEXT,
    copyright TEXT,
    focal_point VARCHAR(64) NOT NULL DEFAULT 'center', -- 'center', 'top', 'bottom', 'left', 'right' or coordinates
    folder VARCHAR(64) NOT NULL DEFAULT 'general', -- 'general', 'hero', 'about', 'services', 'videos', 'brand'
    uploaded_by_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
    uploaded_by_email VARCHAR(255),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_asset_type ON media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_is_archived ON media_assets(is_archived);
CREATE INDEX IF NOT EXISTS idx_media_assets_storage_bucket ON media_assets(storage_bucket);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_public_url ON media_assets(public_url);

-- =========================================================
-- 12. APPOINTMENTS & CONSULTATIONS DATA MODEL (MODULE 04)
-- =========================================================

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(32) PRIMARY KEY,
    enquiry_id VARCHAR(32) NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    purpose TEXT,
    appointment_type VARCHAR(64) NOT NULL DEFAULT 'telephone', -- 'telephone', 'in_person', 'on_site', 'google_meet', 'ms_teams', 'zoom'
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no_show'
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    timezone VARCHAR(64) NOT NULL DEFAULT 'America/Toronto',
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    location_or_link TEXT,
    assigned_staff_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
    assigned_staff_name VARCHAR(255),
    staff_notes TEXT,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    notification_sent_at TIMESTAMPTZ,
    idempotency_key VARCHAR(128) UNIQUE,
    cancellation_reason TEXT,
    rescheduled_from_id VARCHAR(32) REFERENCES appointments(id) ON DELETE SET NULL,
    created_by VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_enquiry_id ON appointments(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_staff_id ON appointments(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_idempotency_key ON appointments(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

CREATE TABLE IF NOT EXISTS appointment_activity (
    id VARCHAR(64) PRIMARY KEY,
    appointment_id VARCHAR(32) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL, -- 'created', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show', 'notification_sent', 'notification_failed'
    performed_by VARCHAR(128) NOT NULL,
    details TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_activity_appointment_id ON appointment_activity(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_activity_created_at ON appointment_activity(created_at DESC);

CREATE TABLE IF NOT EXISTS appointment_notifications (
    id VARCHAR(64) PRIMARY KEY,
    appointment_id VARCHAR(32) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(64) NOT NULL, -- 'invitation', 'rescheduled', 'cancellation'
    status VARCHAR(32) NOT NULL, -- 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_notifications_appointment_id ON appointment_notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_sent_at ON appointment_notifications(sent_at DESC);


-- 10. Appointment Settings Table (Stage B)
CREATE TABLE IF NOT EXISTS appointment_settings (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
    working_days JSONB NOT NULL DEFAULT '{
      "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "friday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "saturday": {"enabled": true, "start": "09:00", "end": "16:00"},
      "sunday": {"enabled": false, "start": "09:00", "end": "16:00"}
    }'::jsonb,
    buffer_minutes INT NOT NULL DEFAULT 15,
    min_notice_hours INT NOT NULL DEFAULT 2,
    max_booking_days INT NOT NULL DEFAULT 30,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    allowed_channels JSONB NOT NULL DEFAULT '["telephone", "on_site", "in_person", "google_meet"]'::jsonb,
    auto_confirm BOOLEAN NOT NULL DEFAULT TRUE,
    blocked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    channel_instructions JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 11. Provider Integrations Table (Stage B)
CREATE TABLE IF NOT EXISTS provider_integrations (
    id VARCHAR(64) PRIMARY KEY,
    provider_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'disconnected',
    account_email VARCHAR(255),
    encrypted_credentials TEXT,
    sync_calendar_conflicts BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_integrations_provider_name ON provider_integrations(provider_name);
CREATE INDEX IF NOT EXISTS idx_provider_integrations_status ON provider_integrations(status);

-- OAuth States for Multi-Instance CSRF Protection
CREATE TABLE IF NOT EXISTS oauth_states (
  state VARCHAR(128) PRIMARY KEY,
  provider VARCHAR(64) NOT NULL,
  admin_user_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_admin_user_id ON oauth_states(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
