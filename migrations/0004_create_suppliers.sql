-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for listing suppliers by date
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at DESC);

-- Index for searching by name
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Index for filtering by city
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
