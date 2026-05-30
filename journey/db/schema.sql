CREATE TABLE areas (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  order_idx INTEGER NOT NULL DEFAULT 0,
  name_en TEXT NOT NULL,
  name_cs TEXT NOT NULL
);

CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  area_id TEXT REFERENCES areas(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  order_idx INTEGER NOT NULL DEFAULT 0,
  subtitle_en TEXT NOT NULL DEFAULT '',
  subtitle_cs TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  title_cs TEXT NOT NULL DEFAULT '',
  UNIQUE(area_id, slug)
);

CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  order_idx INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'quote')),
  content_en TEXT NOT NULL DEFAULT '',
  content_cs TEXT NOT NULL DEFAULT ''
);
