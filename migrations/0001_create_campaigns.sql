-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    preview_text TEXT,
    content TEXT NOT NULL, -- HTML content
    status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, failed
    sent_at TEXT,
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for listing campaigns by date
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
