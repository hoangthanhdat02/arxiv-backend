-- =========================================================================
-- Schema Definition: arXiv Client Data & Library
-- =========================================================================

-- 1. Table: papers
CREATE TABLE IF NOT EXISTS papers (
    id VARCHAR(50) PRIMARY KEY, -- e.g., "2401.00001"
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    published_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ,
    primary_category VARCHAR(50) NOT NULL,
    pdf_url TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    fts tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || abstract)) STORED
);

CREATE INDEX IF NOT EXISTS papers_fts_idx ON papers USING GIN (fts);
CREATE INDEX IF NOT EXISTS papers_published_idx ON papers (published_date DESC);
CREATE INDEX IF NOT EXISTS papers_category_idx ON papers (primary_category);

-- 2. Table: user_library (Bookmarks & Notes)
CREATE TABLE IF NOT EXISTS user_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    paper_id VARCHAR(50) REFERENCES papers(id) ON DELETE CASCADE,
    note TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, paper_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read and manage their own library"
    ON user_library FOR ALL
    USING (auth.uid() = user_id);
