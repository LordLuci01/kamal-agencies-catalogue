'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Package, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { supabase, type Company, type Product } from '@/lib/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ companies: 0, activeCompanies: 0, products: 0, activeProducts: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: companies }, { count: activeCompanies }, { count: products }, { count: activeProducts }, { count: featured }, { data: recent }] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_featured', true),
        supabase.from('companies').select('id, name, slug, retail_discount, wholesale_discount, is_active, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        companies: companies ?? 0,
        activeCompanies: activeCompanies ?? 0,
        products: products ?? 0,
        activeProducts: activeProducts ?? 0,
        featured: featured ?? 0,
      });
      setRecentCompanies((recent as Company[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: 'Total Companies', value: stats.companies, sub: `${stats.activeCompanies} active`, icon: Building2, href: '/admin/companies' },
    { label: 'Total Products', value: stats.products, sub: `${stats.activeProducts} active`, icon: Package, href: '/admin/products' },
    { label: 'Featured Companies', value: stats.featured, sub: 'shown on homepage', icon: TrendingUp, href: '/admin/companies' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your catalogue.</p>
        </div>
        <Link href="/admin/companies" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Manage Companies
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <card.icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{loading ? '—' : card.value}</p>
            <p className="text-sm font-medium text-foreground">{card.label}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Recent Companies</h2>
          <Link href="/admin/companies" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {recentCompanies.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No companies yet. <Link href="/admin/companies" className="text-primary hover:underline">Add your first company</Link>.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentCompanies.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Retail {Number(c.retail_discount)}% · Wholesale {Number(c.wholesale_discount)}%
                  </p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${c.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
