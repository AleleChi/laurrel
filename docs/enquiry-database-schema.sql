-- ========================================================
-- LAURREL SERVICES — PRODUCTION DATABASE SCHEMA
-- PostgreSQL schema for customer enquiries, service details & status tracking
-- ========================================================

-- 1. Create Enquiry Status Enum
CREATE TYPE enquiry_status AS ENUM (
  'new',
  'under_review',
  'awaiting_information',
  'quoted',
  'accepted',
  'closed'
);

-- 2. Create Enquiry Intent Enum
CREATE TYPE enquiry_intent AS ENUM (
  'general_contact',
  'quote_request',
  'service_sidebar',
  'ai_assisted_enquiry'
);

-- 3. Create Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
  id VARCHAR(32) PRIMARY KEY, -- e.g. ENQ-20261015-8492
  intent enquiry_intent NOT NULL DEFAULT 'general_contact',
  source VARCHAR(64) NOT NULL DEFAULT 'web',
  
  -- Customer Details
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(40),
  
  -- Service Details
  services TEXT[] NOT NULL DEFAULT '{"general"}',
  service_location VARCHAR(255),
  preferred_timing VARCHAR(255),
  details TEXT NOT NULL,
  service_specific_details JSONB, -- stores { cleaning: {...}, moving: {...}, storage: {...} }
  
  -- Workflow & Auditing
  status enquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Internal Notes & Audit Trail Table
CREATE TABLE IF NOT EXISTS enquiry_internal_notes (
  id BIGSERIAL PRIMARY KEY,
  enquiry_id VARCHAR(32) NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL DEFAULT 'system',
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for fast status filtering and customer search
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(customer_email);
CREATE INDEX IF NOT EXISTS idx_enquiries_intent ON enquiries(intent);
