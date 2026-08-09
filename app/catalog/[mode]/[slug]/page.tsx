import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/public-shell';
import { CompanyHeader } from '@/components/company-header';
import { ProductList, PAGE_SIZE } from '@/components/product-list';
import { CatalogueProvider } from '@/components/catalogue-context';
import { SearchBar } from '@/components/search-bar';
import type { CatalogueMode, Company, Product } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type Params = { mode: string; slug: string };

type SearchParams = { q?: string; page?: string };

export async function generateMetadata({ params }: { params: Params }) {
  if (params.mode !== 'retail' && params.mode !== 'wholesale') return { title: 'Catalogue' };
  const mode: CatalogueMode = params.mode;
  const supabase = createServerClient();
  const { data } = await supabase
    .from('companies')
    .select('name')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) return { title: 'Company Not Found' };
  const label = mode === 'wholesale' ? 'Wholesale' : 'Retail';
  return {
    title: `${data.name} Products — ${label} Discount | Kamal Agencies`,
    description: `Browse ${data.name} products with company-wise ${label.toLowerCase()} discount from Kamal Agencies.`,
  };
}

export default async function CatalogueCompanyPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  if (params.mode !== 'retail' && params.mode !== 'wholesale') notFound();
  const mode: CatalogueMode = params.mode;
  const supabase = createServerClient();

  const { data: companyRaw } = await supabase
    .from('companies')
    .select('id, name, slug, logo_url, description, retail_discount, wholesale_discount, is_featured, display_order, is_active, created_at, updated_at')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!companyRaw) notFound();
  const company = companyRaw as unknown as Company;

  const requestedPage = Number.parseInt(searchParams.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage - 1 : 0;
  const query = (searchParams.q ?? '').trim();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let productQuery = supabase
    .from('products')
    .select('id, company_id, name, slug, packing, category, mrp, is_active, display_order, created_at, updated_at', { count: 'exact' })
    .eq('company_id', company.id)
    .eq('is_active', true);

  if (query) {
    productQuery = productQuery.ilike('name', `%${query}%`);
  }

  const { data: productsRaw, count } = await productQuery
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, to);

  const products = (productsRaw ?? []) as unknown as Product[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  // If an out-of-range page is requested, show the final valid page rather than an empty catalogue.
  if (page !== safePage) {
    const safeFrom = safePage * PAGE_SIZE;
    const safeTo = safeFrom + PAGE_SIZE - 1;
    let fallbackQuery = supabase
      .from('products')
      .select('id, company_id, name, slug, packing, category, mrp, is_active, display_order, created_at, updated_at')
      .eq('company_id', company.id)
      .eq('is_active', true);
    if (query) {
      fallbackQuery = fallbackQuery.ilike('name', `%${query}%`);
    }
    const { data: fallbackProducts } = await fallbackQuery
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .range(safeFrom, safeTo);
    products.splice(0, products.length, ...((fallbackProducts ?? []) as unknown as Product[]));
  }

  const basePath = `/catalog/${mode}/${company.slug}`;

  return (
    <PublicShell>
      <CatalogueProvider mode={mode}>
        <CompanyHeader company={company} mode={mode} productCount={total} />

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-4 max-w-xl">
            <SearchBar mode={mode} variant="compact" />
          </div>
          <ProductList
            products={products}
            initialQuery={query}
            page={safePage}
            total={total}
            basePath={basePath}
          />
        </div>
      </CatalogueProvider>
    </PublicShell>
  );
}
