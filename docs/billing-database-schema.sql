-- ==============================================================================
-- LAURREL SERVICES — BILLING, QUOTES & INVOICING DATABASE SCHEMA
-- Target Environment: PostgreSQL 14+ / Supabase / Neon
-- Canadian Currency: CAD | Integer cents architecture for precision
-- Canadian Tax: 13% Ontario HST | Deterministic calculation only
-- PCI Compliance: Zero raw payment-card data stored on server
-- ==============================================================================

-- 1. ENUMS FOR STATUS & LIFECYCLE
CREATE TYPE quote_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'sent',
    'accepted',
    'declined',
    'expired'
);

CREATE TYPE invoice_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'sent',
    'paid',
    'void',
    'uncollectible'
);

CREATE TYPE payment_status AS ENUM (
    'unpaid',
    'processing',
    'succeeded',
    'failed',
    'refunded'
);

-- 2. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(32) PRIMARY KEY, -- e.g. QUO-20261015-4921
    enquiry_reference_id VARCHAR(32) REFERENCES enquiries(reference_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status quote_status NOT NULL DEFAULT 'draft',
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    service_address TEXT,
    
    -- Financial Totals (Stored in integer cents to eliminate floating-point drift)
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    tax_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.130, -- 13% Ontario HST
    tax_cents INTEGER NOT NULL CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    
    -- Validity & Administration
    valid_until TIMESTAMPTZ NOT NULL,
    notes TEXT,
    admin_approved_by VARCHAR(255),
    admin_approved_at TIMESTAMPTZ,
    customer_accepted_at TIMESTAMPTZ
);

-- 3. QUOTATION LINE ITEMS TABLE
CREATE TABLE IF NOT EXISTS quote_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id VARCHAR(32) NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    service_category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(6, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(32) PRIMARY KEY, -- e.g. INV-20261015-8120
    quote_id VARCHAR(32) REFERENCES quotes(id) ON DELETE SET NULL,
    enquiry_reference_id VARCHAR(32) REFERENCES enquiries(reference_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status invoice_status NOT NULL DEFAULT 'draft',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    billing_address TEXT,
    
    -- Financial Totals (Integer cents)
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    tax_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.130,
    tax_cents INTEGER NOT NULL CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    
    -- Payment Provider Integration (Stripe)
    payment_provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
    provider_invoice_id VARCHAR(255),
    provider_payment_intent_id VARCHAR(255),
    provider_hosted_url VARCHAR(512),
    
    -- Administrative Review & Approvals
    admin_approved_by VARCHAR(255),
    admin_approved_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ
);

-- 5. INVOICE LINE ITEMS TABLE
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id VARCHAR(32) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    service_category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(6, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. WEBHOOK AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS billing_webhook_logs (
    id VARCHAR(128) PRIMARY KEY,
    event_type VARCHAR(128) NOT NULL,
    provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
    invoice_id VARCHAR(32),
    amount_received_cents INTEGER,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. INDEXES FOR PERFORMANCE & AUDITING
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON invoices(customer_email);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON billing_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_invoice_id ON billing_webhook_logs(invoice_id);
