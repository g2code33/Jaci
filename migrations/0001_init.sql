-- Jaci Birthday — initial schema (Cloudflare D1)
--
-- The experience is driven by one centralised `Store` document
-- (draft + published config + metadata), persisted as a single row.
-- This keeps the data model simple and fully editable from the admin
-- dashboard. Media files themselves are never stored here — only their
-- Cloudinary public IDs / URLs.

CREATE TABLE IF NOT EXISTS config_store (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
