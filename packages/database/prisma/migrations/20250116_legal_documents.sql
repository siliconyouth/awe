-- Create legal_documents table for managing ToS, Privacy Policy, etc.
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'terms', 'privacy', 'cookie', 'gdpr', 'ai-policy'
  version VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  effective_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'en',
  jurisdiction VARCHAR(50) DEFAULT 'global', -- 'us', 'eu', 'global'
  
  -- Metadata
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  approved_by VARCHAR(255),
  approval_date TIMESTAMP,
  
  -- Versioning
  previous_version_id UUID REFERENCES legal_documents(id),
  change_summary TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: only one active document per type/language/jurisdiction
  CONSTRAINT unique_active_document UNIQUE (type, language, jurisdiction, is_active)
);

-- Create index for faster queries
CREATE INDEX idx_legal_documents_type_active ON legal_documents(type, is_active);
CREATE INDEX idx_legal_documents_effective_date ON legal_documents(effective_date);

-- Create user_agreements table to track user acceptance
CREATE TABLE IF NOT EXISTS user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  document_id UUID NOT NULL REFERENCES legal_documents(id),
  document_type VARCHAR(50) NOT NULL,
  document_version VARCHAR(20) NOT NULL,
  
  -- Agreement details
  agreed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Optional: specific consent items
  consent_items JSONB, -- e.g., {"marketing": true, "analytics": false}
  
  -- Withdrawal support
  withdrawn BOOLEAN DEFAULT false,
  withdrawn_at TIMESTAMP,
  withdrawal_reason TEXT,
  
  -- Indexes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure user can only agree once per document version
  CONSTRAINT unique_user_agreement UNIQUE (user_id, document_id)
);

-- Create index for user agreements
CREATE INDEX idx_user_agreements_user ON user_agreements(user_id);
CREATE INDEX idx_user_agreements_document ON user_agreements(document_id);

-- Create legal_changes_log table for audit trail
CREATE TABLE IF NOT EXISTS legal_changes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES legal_documents(id),
  change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'activated', 'deactivated'
  changed_by VARCHAR(255) NOT NULL,
  change_details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for changes log
CREATE INDEX idx_legal_changes_log_document ON legal_changes_log(document_id);
CREATE INDEX idx_legal_changes_log_timestamp ON legal_changes_log(timestamp);