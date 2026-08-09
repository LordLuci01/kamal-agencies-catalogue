/*
# Create storage bucket for company logos and product images

1. Storage
- Creates a public bucket `company-assets` for logos and images.
- Public read; authenticated upload/update/delete.
2. Policies
- anon/authenticated: SELECT (read) objects
- authenticated: INSERT, UPDATE, DELETE objects
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "public_read_company_assets" ON storage.objects;
CREATE POLICY "public_read_company_assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'company-assets');

-- Authenticated insert
DROP POLICY IF EXISTS "auth_insert_company_assets" ON storage.objects;
CREATE POLICY "auth_insert_company_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- Authenticated update
DROP POLICY IF EXISTS "auth_update_company_assets" ON storage.objects;
CREATE POLICY "auth_update_company_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets')
WITH CHECK (bucket_id = 'company-assets');

-- Authenticated delete
DROP POLICY IF EXISTS "auth_delete_company_assets" ON storage.objects;
CREATE POLICY "auth_delete_company_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');
