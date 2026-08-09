import Link from 'next/link';
import { Pill, Phone, Mail, MapPin } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';

export async function SiteFooter() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('site_settings')
    .select('logo_url')
    .eq('id', 1)
    .maybeSingle();
  const logoUrl = data?.logo_url ?? null;

  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Kamal Agencies" className="h-10 w-auto max-w-[160px] object-contain" />
              ) : (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Pill className="h-5 w-5" />
                  </span>
                  <span className="font-serif text-lg font-semibold">Kamal Agencies</span>
                </>
              )}
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Wholesale Distributor of Pharmaceuticals &amp; Healthcare Products. Since 1996.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Catalogue</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/companies" className="text-muted-foreground hover:text-foreground">All Companies</Link></li>
              <li><Link href="/catalog/retail" className="text-muted-foreground hover:text-foreground">Retail Catalogue</Link></li>
              <li><Link href="/catalog/wholesale" className="text-muted-foreground hover:text-foreground">Wholesale Catalogue</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <a href="tel:6205259004" className="hover:text-foreground">6205259004</a>,{' '}
                  <a href="tel:8252554209" className="hover:text-foreground">8252554209</a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:kamalagencies1996@gmail.com" className="hover:text-foreground">kamalagencies1996@gmail.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>2nd Floor, Hari Mohan Apt., Shradhanand Road, Ranchi</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kamal Agencies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
