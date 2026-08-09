import Link from 'next/link';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/lib/supabase/client';

const PAGE_SIZE = 60;

export function ProductList({
  products,
  page,
  total,
  query,
  basePath,
}: {
  products: Product[];
  page: number;
  total: number;
  query?: string;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrevious = page > 0;
  const hasNext = page < totalPages - 1;

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query?.trim()) params.set('q', query.trim());
    if (nextPage > 0) params.set('page', String(nextPage + 1));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{total.toLocaleString('en-IN')} {total === 1 ? 'product' : 'products'}</span>
        {totalPages > 1 && <span>Page {page + 1} of {totalPages}</span>}
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {products.map((product) => (
            <li
              key={product.id}
              id={`product-${product.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <Package className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{product.name}</p>
                {product.packing && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{product.packing}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          {hasPrevious ? (
            <Link
              href={pageHref(page - 1)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNext ? (
            <Link
              href={pageHref(page + 1)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

export { PAGE_SIZE };
