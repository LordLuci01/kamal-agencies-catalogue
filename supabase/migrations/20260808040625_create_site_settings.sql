/*
# Create site_settings table for Kamal Agencies branding

A single-row settings table holding the site logo URL and other editable
branding. Public read; authenticated update only.

1. New Table
- site_settings (id int PK always 1, logo_url text, updated_at timestamptz)
2. Seed one default row.
3. RLS: public SELECT; authenticated UPDATE only.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO site_settings (id, logo_url) VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings"
ON site_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_update_site_settings" ON site_settings;
CREATE POLICY "auth_update_site_settings"
ON site_settings FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);
