-- Create editions table
CREATE TABLE IF NOT EXISTS ediciones (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha TEXT,
    publicada INTEGER DEFAULT 0,
    cover_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create pages table
CREATE TABLE IF NOT EXISTS paginas (
    id TEXT PRIMARY KEY,
    edicion_id TEXT NOT NULL,
    numero INTEGER NOT NULL,
    imagen_url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (edicion_id) REFERENCES ediciones(id) ON DELETE CASCADE,
    UNIQUE(edicion_id, numero)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ediciones_fecha ON ediciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_paginas_edicion ON paginas(edicion_id, numero ASC);
