import Link from 'next/link';
import { Search, Building2, ArrowRight, ShieldCheck, Truck, Pill, Phone, MapPin } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/public-shell';
import { SearchBar } from '@/components/search-bar';
import { CompanyCard } from '@/components/company-card';
import type { CompanyWithCount } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServerClient();

  const { data: featuredRaw } = await supabase
    .from('companies')
    .select('id, name, slug, logo_url, description, retail_discount, wholesale_discount, is_featured, display_order, is_active')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(12);

  const featured = (featuredRaw ?? []) as unknown as CompanyWithCount[];

  // Get product counts for featured companies
  let featuredWithCounts: CompanyWithCount[] = featured;
  if (featured.length > 0) {
    const ids = featured.map((c) => c.id);
    const { data: counts } = await supabase.rpc('active_product_count_multi', { company_ids: ids });
    if (counts && Array.isArray(counts)) {
      const countMap = new Map<string, number>();
      (counts as { company_id: string; count: number }[]).forEach((row) => countMap.set(row.company_id, row.count));
      featuredWithCounts = featured.map((c) => ({ ...c, product_count: countMap.get(c.id) ?? 0 }));
    } else {
      // fallback: individual counts
      const counted = await Promise.all(
        featured.map(async (c) => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', c.id)
            .eq('is_active', true);
          return { ...c, product_count: count ?? 0 };
        })
      );
      featuredWithCounts = counted;
    }
  }

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/50 to-background">
        <div className="absolute inset-0 -z-10 opacity-[0.04]" aria-hidden>
          <div className="absolute left-1/4 top-10 h-64 w-64 rounded-full bg-primary blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Wholesale Distributor · Since 1996
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Kamal Agencies
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Wholesale Distributor of Pharmaceuticals &amp; Healthcare Products. Browse 185+ companies, explore products, and find the right catalogue for your requirement.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar mode={undefined} variant="hero" />
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/companies"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] sm:w-auto"
            >
              <Building2 className="h-4 w-4" />
              Browse Companies
            </Link>
            <Link
              href="/catalog/retail"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:bg-accent hover:shadow-sm active:scale-[0.99] sm:w-auto"
            >
              Retail Catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/catalog/wholesale"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:bg-accent hover:shadow-sm active:scale-[0.99] sm:w-auto"
            >
              Wholesale Catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured companies */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">Featured Companies</h2>
            <p className="mt-1 text-sm text-muted-foreground">Leading brands distributed by Kamal Agencies.</p>
          </div>
          <Link href="/companies" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredWithCounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              No featured companies yet. Companies marked as featured by the admin will appear here.
            </p>
            <Link href="/companies" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse all companies <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredWithCounts.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </section>

      {/* Trust / About strip */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Trusted Since 1996</h3>
              <p className="mt-1 text-sm text-muted-foreground">Nearly three decades serving Ranchi&rsquo;s pharmaceutical needs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Wide Distribution</h3>
              <p className="mt-1 text-sm text-muted-foreground">12,000+ products across leading pharmaceutical companies.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Easy Contact</h3>
              <p className="mt-1 text-sm text-muted-foreground">Call or WhatsApp us for orders and enquiries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="mx-auto max-w-6xl px-4 pb-2 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Expiry Policy</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Products with expiry of up to 3 months past the expiry date will be accepted. Example: January 2026 expiry is accepted through March 2026.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Wholesale Pricing</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Wholesale discounts are not published publicly. Contact Kamal Agencies for applicable pricing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-md sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold">Need help with an order?</h2>
              <p className="mt-2 max-w-md text-sm text-primary-foreground/90">
                Contact Kamal Agencies for product availability, pricing, and wholesale enquiries.
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-primary-foreground/90">
                <MapPin className="h-4 w-4" />
                2nd Floor, Hari Mohan Apt., Shradhanand Road, Ranchi
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:w-auto">
              <a href="tel:6205259004" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-background px-5 text-sm font-medium text-primary shadow-sm">
                <Phone className="h-4 w-4" /> 6205259004
              </a>
              <a href="https://wa.me/918252554209" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-background/15 px-5 text-sm font-medium text-primary-foreground ring-1 ring-primary-foreground/30">
                WhatsApp 8252554209
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
