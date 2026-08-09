import Link from 'next/link';
import { ArrowRight, Building2, ShoppingBag, Store } from 'lucide-react';
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
            Choose the catalogue you need. Company discounts are shown according to the selected catalogue.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-14">
        <Link href="/catalog/retail" className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-success/40 hover:shadow-md">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
            <Store className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground">Retail Catalogue</h2>
          <p className="mt-2 text-sm text-muted-foreground">Browse companies and view their retail discounts.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Browse retail <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>

        <Link href="/catalog/wholesale" className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground">Wholesale Catalogue</h2>
          <p className="mt-2 text-sm text-muted-foreground">Browse companies and view their wholesale discounts.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Browse wholesale <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      </div>
    </PublicShell>
  );
}
