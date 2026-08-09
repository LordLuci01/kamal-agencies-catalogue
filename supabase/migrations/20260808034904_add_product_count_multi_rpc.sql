/*
# Add active_product_count_multi RPC

Adds a SECURITY DEFINER function that returns active product counts for a list
of company UUIDs in a single query. Used by the homepage and company directory
to avoid N+1 queries when showing company cards with product counts.

The function is callable by anon + authenticated (public catalogue reads).
*/

DROP FUNCTION IF EXISTS active_product_count_multi(uuid[]);
CREATE OR REPLACE FUNCTION active_product_count_multi(company_ids uuid[])
RETURNS TABLE (company_id uuid, count int)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id AS company_id,
         COALESCE(p.cnt, 0)::int AS count
  FROM unnest(company_ids) AS c(id)
  LEFT JOIN (
    SELECT company_id, count(*)::int AS cnt
    FROM products
    WHERE is_active = true
    GROUP BY company_id
  ) p ON p.company_id = c.id;
$$;

GRANT EXECUTE ON FUNCTION active_product_count_multi(uuid[]) TO anon, authenticated;
