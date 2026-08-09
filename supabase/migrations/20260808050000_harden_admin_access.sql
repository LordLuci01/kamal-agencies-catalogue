/*
# Harden admin access

Public users can read active catalogue data, but only users listed in
public.admin_users may modify catalogue content.

Bootstrap behavior:
- Before the first admin is added, an authenticated user is considered the
  bootstrap admin. This allows the existing first admin account to enter the
  panel and be registered with the SQL snippet shown in the project README.
- Once at least one admin_users row exists, only listed admins can write.

Run after creating the first Supabase Auth user:
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'YOUR-ADMIN-EMAIL'
ON CONFLICT DO NOTHING;
*/

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_read_self" ON public.admin_users;
CREATE POLICY "admin_users_read_self"
ON public.admin_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      NOT EXISTS (SELECT 1 FROM public.admin_users)
      OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Replace broad authenticated-write policies with admin-only policies.
DROP POLICY IF EXISTS "admin_insert_companies" ON public.companies;
CREATE POLICY "admin_insert_companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "admin_update_companies" ON public.companies;
CREATE POLICY "admin_update_companies"
ON public.companies FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "admin_delete_companies" ON public.companies;
CREATE POLICY "admin_delete_companies"
ON public.companies FOR DELETE
TO authenticated
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
CREATE POLICY "admin_insert_products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products"
ON public.products FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
CREATE POLICY "admin_delete_products"
ON public.products FOR DELETE
TO authenticated
USING (public.is_current_user_admin());

-- Site settings are also admin-only for writes.
DROP POLICY IF EXISTS "auth_update_site_settings" ON public.site_settings;
CREATE POLICY "auth_update_site_settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Storage writes are admin-only as well.
DROP POLICY IF EXISTS "auth_insert_company_assets" ON storage.objects;
CREATE POLICY "auth_insert_company_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets' AND public.is_current_user_admin());

DROP POLICY IF EXISTS "auth_update_company_assets" ON storage.objects;
CREATE POLICY "auth_update_company_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets' AND public.is_current_user_admin())
WITH CHECK (bucket_id = 'company-assets' AND public.is_current_user_admin());

DROP POLICY IF EXISTS "auth_delete_company_assets" ON storage.objects;
CREATE POLICY "auth_delete_company_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets' AND public.is_current_user_admin());

-- Public product reads must only expose products belonging to active companies.
DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
CREATE POLICY "public_read_active_products"
ON public.products FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = products.company_id AND c.is_active = true
  )
);

-- Composite indexes for large-catalogue company pages and pagination.
CREATE INDEX IF NOT EXISTS products_company_active_order_name_idx
ON public.products (company_id, is_active, display_order, name);

CREATE INDEX IF NOT EXISTS products_packing_trgm_idx
ON public.products USING gin (packing gin_trgm_ops);
