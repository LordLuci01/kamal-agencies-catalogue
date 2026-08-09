# Kamal Agencies Digital Catalogue

A mobile-first digital product catalogue for Kamal Agencies with separate retail and wholesale catalogue routes and company-wise discounts.

## Core model

**Company → Retail Discount / Wholesale Discount → Products**

Products do not store discount or scheme information.

## Routes

- `/` — public homepage
- `/companies` — catalogue-mode chooser
- `/catalog/retail` — retail company catalogue
- `/catalog/wholesale` — wholesale company catalogue
- `/catalog/retail/[company-slug]` — retail company products
- `/catalog/wholesale/[company-slug]` — wholesale company products
- `/admin/login` — admin sign in
- `/admin` — admin dashboard

## Large catalogue behavior

Company product pages use database-side pagination (60 products per page) instead of loading an entire company catalogue into the browser. Global search is database-backed.

## Admin setup

See `ADMIN_SETUP.md` for the one-time admin authorization setup.

After the first admin is registered in `public.admin_users`, only listed admins can modify catalogue data.

## Supabase migrations

Run all files under `supabase/migrations/` in order. The latest migration hardens admin writes and adds large-catalogue indexes.

## Product CSV

Import columns:

`name,company,packing,category,mrp`

Company names must match an existing company. Duplicate rows for the same company/product slug are collapsed during import and existing products are updated through upsert.
