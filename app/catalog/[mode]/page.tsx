import { notFound } from 'next/navigation';
import { Building2, Sparkles } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/public-shell';
import { SearchBar } from '@/components/search-bar';
import { CompanyCard } from '@/components/company-card';
import { CatalogueProvider } from '@/components/catalogue-context';
import type { CatalogueMode, CompanyWithCount } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { mode: string } }) {
  const isWholesale = params.mode === 'wholesale';
  return {
    title: isWholesale ? 'Wholesale Catalogue' : 'Retail Catalogue',
    description: isWholesale
      ? 'Browse Kamal Agencies wholesale catalogue with company-wise wholesale discounts.'
      : 'Browse Kamal Agencies retail catalogue with company-wise retail discounts.',
    robots: { index: true, follow: true },
  };
}

export default async function CatalogueModePage({ params }: { params: { mode: string } }) {
  if (params.mode !== 'retail' && params.mode !== 'wholesale') notFound();
  const mode: CatalogueMode = params.mode === 'wholesale' ? 'wholesale' : 'retail';
  const isWholesale = mode === 'wholesale';

  const supabase = createServerClient();

  const { data: companiesRaw } = await supabase
    .from('companies')
    .select('id, name, slug, logo_url, description, retail_discount, wholesale_discount, is_featured, display_order, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  const companies = (companiesRaw ?? []) as unknown as CompanyWithCount[];

  let companiesWithCounts = companies;
  if (companies.length > 0) {
    const ids = companies.map((c) => c.id);
    const { data: counts } = await supabase.rpc('active_product_count_multi', { company_ids: ids });
    if (counts && Array.isArray(counts)) {
      const countMap = new Map<string, number>();
      (counts as { company_id: string; count: number }[]).forEach((row) => countMap.set(row.company_id, row.count));
      companiesWithCounts = companies.map((c) => ({ ...c, product_count: countMap.get(c.id) ?? 0 }));
    }
  }

  return (
    <PublicShell>
      <CatalogueProvider mode={mode}>
        <div className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isWholesale ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {isWholesale ? 'Wholesale Mode' : 'Retail Mode'}
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {isWholesale ? 'Wholesale Catalogue' : 'Retail Catalogue'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {isWholesale
                ? 'Browse companies and view their wholesale discount. Each company\'s discount applies to all its products.'
                : 'Browse companies and view their retail discount. Each company\'s discount applies to all its products.'}
            </p>

            <div className="mt-5 max-w-2xl">
              <SearchBar mode={mode} variant="hero" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {companies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">No companies available yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{companies.length} companies</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {companiesWithCounts.map((company) => (
                  <CompanyCard key={company.id} company={company} mode={mode} />
                ))}
              </div>
            </>
          )}
        </div>
      </CatalogueProvider>
    </PublicShell>
  );
}
