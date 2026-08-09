import Link from 'next/link';
import { ArrowRight, Building2, ShoppingBag, Store, ShieldCheck } from 'lucide-react';
import { PublicShell } from '@/components/public-shell';

export const metadata = {
  title: 'Browse Companies | Kamal Agencies',
  description: 'Choose the Kamal Agencies retail or wholesale catalogue and browse companies.',
};

export default function CompaniesPage() {
  return (
    <PublicShell>
      <div className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Browse Companies</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Choose the catalogue you need. Retail discounts are shown publicly. Wholesale pricing and discounts are available on request.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-14">
        <Link href="/catalog/retail" className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-success/40 hover:shadow-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
            <Store className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground">Retail Catalogue</h2>
          <p className="mt-2 text-sm text-muted-foreground">Browse companies and view their retail discounts.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Browse retail <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>

        <Link href="/catalog/wholesale" className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground">Wholesale Catalogue</h2>
          <p className="mt-2 text-sm text-muted-foreground">Browse wholesale companies and products. Contact us for applicable pricing and discounts.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Browse wholesale <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4 sm:p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-foreground">Expiry Policy</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Products with expiry of up to 3 months past the expiry date will be accepted. Example: a product expiring in January 2026 will be accepted until March 2026.</p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
