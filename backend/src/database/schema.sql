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
    role VARCHAR(32) NOT NULL DEFAULT 'admin', -- 'owner', 'admin', 'dispatcher'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    password_reset_token VARCHAR(128),
    password_reset_expires TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
