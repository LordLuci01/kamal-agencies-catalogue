'use client';

import Link from 'next/link';
import { Building2, ArrowLeft, Tag, Percent } from 'lucide-react';
import type { Company, CatalogueMode } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function CompanyHeader({
  company,
  mode,
  productCount,
}: {
  company: Company;
  mode?: CatalogueMode;
  productCount: number;
}) {
  const discount = mode === 'wholesale' ? company.wholesale_discount : mode === 'retail' ? company.retail_discount : null;
  const backHref = mode === 'wholesale' ? '/catalog/wholesale' : mode === 'retail' ? '/catalog/retail' : '/companies';

  return (
    <div className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to companies
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border sm:h-20 sm:w-20">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{company.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{productCount} {productCount === 1 ? 'product' : 'products'} available</p>
            {company.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{company.description}</p>
            )}
          </div>
        </div>

        {discount !== null && (
          <div
            className={cn(
              'mt-6 flex items-center gap-4 rounded-xl border p-4 shadow-sm sm:p-5',
              mode === 'wholesale'
                ? 'border-primary/20 bg-primary/5'
                : 'border-success/20 bg-success/5'
            )}
          >
            <span
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                mode === 'wholesale' ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground'
              )}
            >
              <Tag className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {mode === 'wholesale' ? 'Wholesale Discount' : 'Retail Discount'}
              </p>
              <p className="flex items-baseline gap-1.5">
                <span
              className={cn(
                'text-3xl font-bold tabular-nums sm:text-4xl',
                mode === 'wholesale' ? 'text-primary' : 'text-success'
              )}
            >
              {Number(discount)}%
            </span>
                <span className={cn('text-lg font-semibold', mode === 'wholesale' ? 'text-primary' : 'text-success')}>OFF</span>
                <Percent className={cn('h-4 w-4', mode === 'wholesale' ? 'text-primary/70' : 'text-success/70')} />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Applied to all {productCount} {productCount === 1 ? 'product' : 'products'} listed below.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
