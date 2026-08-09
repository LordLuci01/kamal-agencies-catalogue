'use client';

import Link from 'next/link';
import { Building2, Package } from 'lucide-react';
import type { CompanyWithCount, CatalogueMode } from '@/lib/supabase/client';

export function CompanyCard({
  company,
  mode,
}: {
  company: CompanyWithCount;
  mode?: CatalogueMode;
}) {
  const href = mode
    ? mode === 'wholesale'
      ? `/catalog/wholesale/${company.slug}`
      : `/catalog/retail/${company.slug}`
    : `/catalog/retail/${company.slug}`;

  const count = company.product_count ?? 0;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ring-1 ring-border">
        {company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logo_url}
            alt={company.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-foreground group-hover:text-primary">{company.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="h-3 w-3" />
          {count} {count === 1 ? 'Product' : 'Products'}
        </p>
      </div>
    </Link>
  );
}
