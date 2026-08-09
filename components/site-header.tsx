'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, Pill, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from('site_settings')
      .select('logo_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setLogoUrl(data?.logo_url ?? null);
      });
    return () => { active = false; };
  }, []);

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/companies', label: 'Companies' },
    { href: '/catalog/retail', label: 'Retail Catalogue' },
    { href: '/catalog/wholesale', label: 'Wholesale Catalogue' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/companies') return pathname.startsWith('/companies');
    if (href === '/contact') return pathname.startsWith('/contact');
    if (href === '/catalog/retail') return pathname.startsWith('/catalog/retail');
    if (href === '/catalog/wholesale') return pathname.startsWith('/catalog/wholesale');
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Kamal Agencies" className="h-10 w-auto max-w-[160px] object-contain" />
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Pill className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-serif text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Kamal Agencies
                </span>
                <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
                  Since 1996
                </span>
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="tel:6205259004"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Phone className="h-4 w-4 text-primary" />
            6205259004
          </Link>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="tel:6205259004"
              className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Phone className="h-4 w-4" />
              Call 6205259004
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
