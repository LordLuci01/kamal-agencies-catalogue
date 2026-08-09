'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, Loader2, Package, Building2 } from 'lucide-react';
import { supabase, type ProductWithCompany, type Company, type CatalogueMode } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type SearchResult = {
  type: 'product' | 'company';
  id: string;
  name: string;
  packing?: string | null;
  companyName?: string;
  companySlug?: string;
  slug: string;
};

export function SearchBar({
  mode,
  variant = 'hero',
}: {
  mode?: CatalogueMode;
  variant?: 'hero' | 'compact';
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const [productNameRes, productPackingRes, companyRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, slug, packing, company:companies!inner(id, name, slug)')
          .ilike('name', `%${q}%`)
          .eq('is_active', true)
          .eq('company.is_active', true)
          .order('name')
          .limit(12),
        supabase
          .from('products')
          .select('id, name, slug, packing, company:companies!inner(id, name, slug)')
          .ilike('packing', `%${q}%`)
          .eq('is_active', true)
          .eq('company.is_active', true)
          .order('name')
          .limit(8),
        supabase
          .from('companies')
          .select('id, name, slug')
          .ilike('name', `%${q}%`)
          .eq('is_active', true)
          .order('name')
          .limit(6),
      ]);

      const productMap = new Map<string, SearchResult>();
      for (const p of [
        ...((productNameRes.data as unknown as ProductWithCompany[] | null) ?? []),
        ...((productPackingRes.data as unknown as ProductWithCompany[] | null) ?? []),
      ]) {
        productMap.set(p.id, {
          type: 'product',
          id: p.id,
          name: p.name,
          packing: p.packing,
          companyName: p.company?.name,
          companySlug: p.company?.slug,
          slug: p.slug,
        });
      }
      const productResults = Array.from(productMap.values()).slice(0, 15);

      const companyResults: SearchResult[] = (companyRes.data as Company[] | null)?.map((c) => ({
        type: 'company' as const,
        id: c.id,
        name: c.name,
        slug: c.slug,
      })) ?? [];

      setResults([...productResults, ...companyResults]);
      setLoading(false);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const companyHref = (slug: string) => {
    if (mode === 'wholesale') return `/catalog/wholesale/${slug}`;
    if (mode === 'retail') return `/catalog/retail/${slug}`;
    return `/catalog/retail/${slug}`;
  };

  const productHref = (r: SearchResult) => {
    if (!r.companySlug) return '/catalog/retail';
    return `${companyHref(r.companySlug)}?q=${encodeURIComponent(r.name)}`;
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={cn(
          'relative flex items-center w-full rounded-xl border bg-background transition-shadow',
          isHero
            ? 'h-14 border-border shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring/30'
            : 'h-11 border-border shadow-sm focus-within:ring-2 focus-within:ring-ring/30'
        )}
      >
        <Search className={cn('ml-3.5 h-5 w-5 shrink-0 text-muted-foreground', !isHero && 'h-4 w-4')} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search medicines, products or companies..."
          className={cn(
            'flex-1 bg-transparent px-3 text-foreground placeholder:text-muted-foreground focus:outline-none',
            isHero ? 'text-base sm:text-lg' : 'text-sm'
          )}
          aria-label="Search products and companies"
        />
        {loading && <Loader2 className="mr-3.5 h-4 w-4 animate-spin text-muted-foreground" />}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="mr-2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="py-1">
              {results.map((r, i) => {
                const isProduct = r.type === 'product';
                const href = isProduct ? productHref(r) : companyHref(r.slug);
                return (
                  <li key={`${r.type}-${r.id}-${i}`}>
                    <Link
                      href={href}
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                        setResults([]);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/60"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                          isProduct ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'
                        )}
                      >
                        {isProduct ? <Package className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{r.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {isProduct
                            ? `${r.companyName ?? '—'}${r.packing ? ` · ${r.packing}` : ''}`
                            : 'Company'}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
