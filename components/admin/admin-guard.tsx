'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/admin/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Pill, LayoutDashboard, Building2, Package, LogOut, ExternalLink, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setAdminChecked(true);
      setIsAdmin(false);
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    let active = true;
    if (!user) return;
    setAdminChecked(false);
    supabase.rpc('is_current_user_admin').then(({ data, error }) => {
      if (!active) return;
      const allowed = !error && data === true;
      setIsAdmin(allowed);
      setAdminChecked(true);
      if (!allowed) {
        toast.error('This account is not authorized for the admin panel.');
        router.replace('/admin/login');
      }
    });
    return () => { active = false; };
  }, [user, router]);

  // login page should not render the guard shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading || (user && !adminChecked)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.replace('/admin/login');
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-secondary/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </span>
            <span className="font-serif text-base font-semibold">Kamal Agencies</span>
            <span className="hidden rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent sm:inline-flex">
              <ExternalLink className="h-3.5 w-3.5" /> View site
            </Link>
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent">
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar nav */}
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden">
          <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium',
                  isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
