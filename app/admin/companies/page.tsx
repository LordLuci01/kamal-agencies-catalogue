'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, Star, Loader2, X, Save, ExternalLink } from 'lucide-react';
import { supabase, type Company, type CompanyWithCount } from '@/lib/supabase/client';
import { slugify } from '@/lib/slugify';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LogoUpload } from '@/components/admin/logo-upload';

type Draft = {
  id?: string;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  retail_discount: string;
  wholesale_discount: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: string;
};

const emptyDraft: Draft = {
  name: '', slug: '', logo_url: '', description: '',
  retail_discount: '0', wholesale_discount: '0',
  is_featured: false, is_active: true, display_order: '0',
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Company | null>(null);
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, { retail: string; wholesale: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, slug, logo_url, description, retail_discount, wholesale_discount, is_featured, display_order, is_active, created_at, updated_at')
      .order('name', { ascending: true });
    if (error) {
      toast.error('Failed to load companies');
      setLoading(false);
      return;
    }
    const list = (data as Company[]) ?? [];
    if (list.length > 0) {
      const { data: counts } = await supabase.rpc('active_product_count_multi', { company_ids: list.map((c) => c.id) });
      const countMap = new Map<string, number>();
      if (counts && Array.isArray(counts)) {
        (counts as { company_id: string; count: number }[]).forEach((r) => countMap.set(r.company_id, r.count));
      }
      setCompanies(list.map((c) => ({ ...c, product_count: countMap.get(c.id) ?? 0 })));
    } else {
      setCompanies([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  function openNew() {
    setEditing({ ...emptyDraft });
  }
  function openEdit(c: Company) {
    setEditing({
      id: c.id, name: c.name, slug: c.slug, logo_url: c.logo_url ?? '', description: c.description ?? '',
      retail_discount: String(c.retail_discount), wholesale_discount: String(c.wholesale_discount),
      is_featured: c.is_featured, is_active: c.is_active, display_order: String(c.display_order),
    });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Company name is required'); return; }
    const slug = editing.slug.trim() || slugify(editing.name);
    if (!slug) { toast.error('Could not generate a valid slug'); return; }
    const retail = parseFloat(editing.retail_discount) || 0;
    const wholesale = parseFloat(editing.wholesale_discount) || 0;
    if (retail < 0 || retail > 100 || wholesale < 0 || wholesale > 100) {
      toast.error('Discounts must be between 0 and 100');
      return;
    }
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      slug,
      logo_url: editing.logo_url.trim() || null,
      description: editing.description.trim() || null,
      retail_discount: retail,
      wholesale_discount: wholesale,
      is_featured: editing.is_featured,
      is_active: editing.is_active,
      display_order: parseInt(editing.display_order) || 0,
    };
    if (editing.id) {
      const { error } = await supabase.from('companies').update(payload).eq('id', editing.id);
      if (error) {
        toast.error(error.message.includes('duplicate') ? 'A company with this slug already exists' : error.message);
        setSaving(false);
        return;
      }
      toast.success('Company updated');
    } else {
      const { error } = await supabase.from('companies').insert(payload);
      if (error) {
        toast.error(error.message.includes('duplicate') ? 'A company with this slug already exists' : error.message);
        setSaving(false);
        return;
      }
      toast.success('Company added');
    }
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete(c: Company) {
    const { error } = await supabase.from('companies').update({ is_active: false }).eq('id', c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${c.name} deactivated`);
    setConfirmDelete(null);
    load();
  }

  async function toggleFeatured(c: Company) {
    const { error } = await supabase.from('companies').update({ is_featured: !c.is_featured }).eq('id', c.id);
    if (error) { toast.error(error.message); return; }
    load();
  }
  async function toggleActive(c: Company) {
    const { error } = await supabase.from('companies').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  // Bulk inline discount editing
  function setDiscountDraft(id: string, field: 'retail' | 'wholesale', value: string) {
    const company = companies.find((c) => c.id === id);
    setDiscountDrafts((d) => ({
      ...d,
      [id]: {
        retail: d[id]?.retail ?? String(company?.retail_discount ?? 0),
        wholesale: d[id]?.wholesale ?? String(company?.wholesale_discount ?? 0),
        [field]: value,
      },
    }));
  }
  async function saveDiscount(c: Company) {
    const draft = discountDrafts[c.id];
    if (!draft) return;
    const retail = parseFloat(draft.retail) || 0;
    const wholesale = parseFloat(draft.wholesale) || 0;
    if (retail < 0 || retail > 100 || wholesale < 0 || wholesale > 100) {
      toast.error('Discounts must be between 0 and 100'); return;
    }
    const { error } = await supabase.from('companies').update({ retail_discount: retail, wholesale_discount: wholesale }).eq('id', c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${c.name} discounts updated`);
    setDiscountDrafts((d) => { const n = { ...d }; delete n[c.id]; return n; });
    load();
  }
  function hasDiscountChange(c: Company): boolean {
    const d = discountDrafts[c.id];
    if (!d) return false;
    return parseFloat(d.retail) !== Number(c.retail_discount) || parseFloat(d.wholesale) !== Number(c.wholesale_discount);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage companies and their retail &amp; wholesale discounts. Discounts apply to all products in the company.</p>
        </div>
        <button onClick={openNew} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Company
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">{companies.length === 0 ? 'No companies yet. Add your first company.' : 'No companies match your search.'}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Company</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Retail %</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Wholesale %</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Products</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const d = discountDrafts[c.id] ?? { retail: String(c.retail_discount), wholesale: String(c.wholesale_discount) };
                  const changed = hasDiscountChange(c);
                  return (
                    <tr key={c.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary ring-1 ring-border">
                            {c.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.logo_url} alt={c.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
                          </div>
                          {c.is_featured && <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min={0} max={100} step="0.5"
                          value={d?.retail ?? ''}
                          onChange={(e) => setDiscountDraft(c.id, 'retail', e.target.value)}
                          className="h-9 w-16 rounded-md border border-border bg-background px-2 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min={0} max={100} step="0.5"
                          value={d?.wholesale ?? ''}
                          onChange={(e) => setDiscountDraft(c.id, 'wholesale', e.target.value)}
                          className="h-9 w-16 rounded-md border border-border bg-background px-2 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums text-muted-foreground">{c.product_count ?? 0}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleActive(c)}
                          className={cn('rounded-md px-2 py-0.5 text-xs font-medium', c.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}
                        >
                          {c.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {changed && (
                            <button onClick={() => saveDiscount(c)} className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                              <Save className="h-3 w-3" /> Save
                            </button>
                          )}
                          <button onClick={() => toggleFeatured(c)} title="Toggle featured" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                            <Star className={cn('h-4 w-4', c.is_featured && 'fill-warning text-warning')} />
                          </button>
                          <a href={`/catalog/retail/${c.slug}`} target="_blank" rel="noopener noreferrer" title="View retail catalogue" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button onClick={() => openEdit(c)} title="Edit" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(c)} title="Delete" className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-background shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-4">
              <h2 className="font-serif text-lg font-semibold">{editing.id ? 'Edit Company' : 'Add Company'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <Field label="Company Name" required>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} className={inputCls} placeholder="Sun Pharma" />
              </Field>
              <Field label="Slug" hint="URL-friendly identifier. Auto-generated from name.">
                <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className={inputCls} placeholder="sun-pharma" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Retail Discount %">
                  <input type="number" min={0} max={100} step="0.5" value={editing.retail_discount} onChange={(e) => setEditing({ ...editing, retail_discount: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Wholesale Discount %">
                  <input type="number" min={0} max={100} step="0.5" value={editing.wholesale_discount} onChange={(e) => setEditing({ ...editing, wholesale_discount: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Field label="Logo" hint="Upload a logo image or paste a URL below.">
                <LogoUpload
                  value={editing.logo_url}
                  onChange={(url) => setEditing({ ...editing, logo_url: url })}
                  folder="companies"
                  nameHint={editing.name || editing.slug || 'company'}
                />
                <input value={editing.logo_url} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} className={inputCls} placeholder="…or paste an image URL" />
              </Field>
              <Field label="Description">
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className={inputCls} placeholder="Brief company description (optional)" />
              </Field>
              <Field label="Display Order" hint="Lower numbers appear first">
                <input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: e.target.value })} className={inputCls} />
              </Field>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="h-4 w-4 rounded border-border" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="h-4 w-4 rounded border-border" />
                  Active
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background px-5 py-4">
              <button onClick={() => setEditing(null)} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editing.id ? 'Save Changes' : 'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-semibold">Deactivate {confirmDelete.name}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This will hide the company and its products from the public catalogue without deleting your data.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="h-4 w-4" /> Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-destructive"> *</span>}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
