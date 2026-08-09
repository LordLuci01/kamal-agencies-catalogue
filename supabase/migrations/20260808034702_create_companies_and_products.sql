/*
# Create companies and products tables for Kamal Agencies digital catalogue

## Purpose
Builds the core data layer for a public pharmaceutical catalogue website.
The company is the SINGLE SOURCE OF TRUTH for discounts — products never store
discount information. Discounts are inherited from the parent company.

## New Tables

### companies
- `id` (uuid, primary key)
- `name` (text, not null) — company display name, e.g. "Sun Pharma"
- `slug` (text, unique, not null) — URL slug, e.g. "sun-pharma"
- `logo_url` (text, nullable) — optional company logo URL
- `description` (text, nullable) — optional company description
- `retail_discount` (numeric, default 0) — retail discount percentage
- `wholesale_discount` (numeric, default 0) — wholesale discount percentage
- `is_featured` (boolean, default false) — show on homepage
- `display_order` (int, default 0) — manual ordering
- `is_active` (boolean, default true) — visible in catalogue
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### products
- `id` (uuid, primary key)
- `company_id` (uuid, foreign key -> companies.id ON DELETE CASCADE)
- `name` (text, not null) — product name
- `slug` (text, not null) — URL slug (unique per company)
- `packing` (text, nullable) — e.g. "15 Tablets"
- `category` (text, nullable) — Pharmaceuticals, Generics, OTC, Surgical, Baby Care, Nutrition
- `mrp` (numeric, nullable) — optional MRP
- `is_active` (boolean, default true)
- `display_order` (int, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Indexes
- companies: slug (unique), is_active, is_featured, display_order, name (lower)
- products: company_id, slug, is_active, display_order
- products: name trigram + ilike search, category
- Unique constraint on (company_id, slug)

## Security (RLS)
- companies: public READ of active rows (anon+authenticated); full CRUD for authenticated admins.
- products: public READ of active rows (anon+authenticated); full CRUD for authenticated admins.
- Admin writes require an authenticated session. Public users can only read active catalogue data.
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  description text,
  retail_discount numeric(5,2) NOT NULL DEFAULT 0,
  wholesale_discount numeric(5,2) NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_key ON companies (slug);
CREATE INDEX IF NOT EXISTS companies_active_idx ON companies (is_active);
CREATE INDEX IF NOT EXISTS companies_featured_idx ON companies (is_featured);
CREATE INDEX IF NOT EXISTS companies_display_order_idx ON companies (display_order);
CREATE INDEX IF NOT EXISTS companies_name_lower_idx ON companies (lower(name));

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  packing text,
  category text,
  mrp numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_company_id_idx ON products (company_id);
CREATE INDEX IF NOT EXISTS products_active_idx ON products (is_active);
CREATE INDEX IF NOT EXISTS products_display_order_idx ON products (display_order);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_name_lower_idx ON products (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS products_company_slug_key ON products (company_id, slug);

-- Enable trigram + ilike search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_name_trgm_idx ON companies USING gin (name gin_trgm_ops);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- companies: public read of active rows
DROP POLICY IF EXISTS "public_read_active_companies" ON companies;
CREATE POLICY "public_read_active_companies"
ON companies FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- companies: admin full CRUD (authenticated only)
DROP POLICY IF EXISTS "admin_insert_companies" ON companies;
CREATE POLICY "admin_insert_companies"
ON companies FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_companies" ON companies;
CREATE POLICY "admin_update_companies"
ON companies FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_companies" ON companies;
CREATE POLICY "admin_delete_companies"
ON companies FOR DELETE
TO authenticated USING (true);

-- products: public read of active rows (joined company must be active too via app query)
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- products: admin full CRUD (authenticated only)
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products"
ON products FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products"
ON products FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products"
ON products FOR DELETE
TO authenticated USING (true);

-- updated_at auto-maintenance
DROP FUNCTION IF EXISTS set_updated_at();
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_updated_at ON companies;
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- helper: product count per active company (used by homepage + admin)
DROP FUNCTION IF EXISTS active_product_count(uuid);
CREATE OR REPLACE FUNCTION active_product_count(company_uuid uuid)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM products
  WHERE company_id = company_uuid AND is_active = true;
$$;
