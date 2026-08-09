'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Package, Plus, Search, Pencil, Trash2, Loader2, X, Save, Upload, Download,
} from 'lucide-react';
import { supabase, type Company, type Product, CATEGORIES } from '@/lib/supabase/client';
import { slugify } from '@/lib/slugify';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ProductRow = Product & { company_name?: string };

type Draft = {
  id?: string;
  name: string;
  slug: string;
  company_id: string;
  packing: string;
  category: string;
  mrp: string;
  is_active: boolean;
  display_order: string;
};

const emptyDraft: Draft = {
  name: '', slug: '', company_id: '', packing: '', category: '', mrp: '',
  is_active: true, display_order: '0',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProductRow | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const [importOpen, setImportOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCompanies = useCallback(async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, slug, logo_url, description, retail_discount, wholesale_discount, is_featured, display_order, is_active, created_at, updated_at')
      .order('name', { ascending: true });
    setCompanies((data as Company[]) ?? []);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('products')
      .select('id, company_id, name, slug, packing, category, mrp, is_active, display_order, created_at, updated_at, company:companies!inner(name)', { count: 'exact' })
      .order('name', { ascending: true })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (companyFilter !== 'all') q = q.eq('company_id', companyFilter);
    if (query.trim()) q = q.ilike('name', `%${query.trim()}%`);

    const { data, count, error } = await q;
    if (error) {
      toast.error('Failed to load products');
      setLoading(false);
      return;
    }
    setTotal(count ?? 0);
    setProducts((data as unknown as ProductRow[]) ?? []);
    setLoading(false);
  }, [page, companyFilter, query]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => { setPage(0); }, [companyFilter, query]);

  function openNew() {
    setEditing({ ...emptyDraft, company_id: companies[0]?.id ?? '' });
  }
  function openEdit(p: ProductRow) {
    setEditing({
      id: p.id, name: p.name, slug: p.slug, company_id: p.company_id,
      packing: p.packing ?? '', category: p.category ?? '', mrp: p.mrp != null ? String(p.mrp) : '',
      is_active: p.is_active, display_order: String(p.display_order),
    });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Product name is required'); return; }
    if (!editing.company_id) { toast.error('Please select a company'); return; }
    const slug = editing.slug.trim() || slugify(editing.name);
    const payload = {
      name: editing.name.trim(),
      slug,
      company_id: editing.company_id,
      packing: editing.packing.trim() || null,
      category: editing.category || null,
      mrp: editing.mrp ? parseFloat(editing.mrp) : null,
      is_active: editing.is_active,
      display_order: parseInt(editing.display_order) || 0,
    };
    setSaving(true);
    if (editing.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message.includes('duplicate') ? 'A product with this slug already exists for this company' : error.message); setSaving(false); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast.error(error.message.includes('duplicate') ? 'A product with this slug already exists for this company' : error.message); setSaving(false); return; }
      toast.success('Product added');
    }
    setSaving(false);
    setEditing(null);
    loadProducts();
  }

  async function handleDelete(p: ProductRow) {
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Product deactivated');
    setConfirmDelete(null);
    loadProducts();
  }

  async function toggleActive(p: ProductRow) {
    const { error } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    loadProducts();
  }

  // ---- CSV import ----
  async function handleCsvFile(file: File) {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length <= 1) { toast.error('No data rows found in CSV'); return; }

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = {
      name: header.indexOf('name'),
      company: header.indexOf('company'),
      packing: header.indexOf('packing'),
      category: header.indexOf('category'),
      mrp: header.indexOf('mrp'),
    };

    if (idx.name < 0 || idx.company < 0) {
      toast.error('CSV must have at least "name" and "company" columns');
      return;
    }

    const companyMap = new Map<string, string>();
    companies.forEach((c) => companyMap.set(c.name.trim().toLowerCase(), c.id));

    const unique = new Map<string, {
      name: string; slug: string; company_id: string;
      packing: string | null; category: string | null; mrp: number | null;
      is_active: boolean; display_order: number;
    }>();

    let skipped = 0;
    let duplicateRows = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = r?.[idx.name]?.trim();
      const companyName = r?.[idx.company]?.trim();
      if (!name || !companyName) { skipped++; continue; }

      const companyId = companyMap.get(companyName.toLowerCase());
      if (!companyId) { skipped++; continue; }

      const slug = slugify(name) || `product-${i}`;
      const key = `${companyId}:${slug}`;
      if (unique.has(key)) duplicateRows++;

      const mrpRaw = idx.mrp >= 0 ? r?.[idx.mrp]?.trim() : '';
      const parsedMrp = mrpRaw ? Number(mrpRaw) : null;

      unique.set(key, {
        name,
        slug,
        company_id: companyId,
        packing: idx.packing >= 0 ? (r?.[idx.packing]?.trim() || null) : null,
        category: idx.category >= 0 ? (r?.[idx.category]?.trim() || null) : null,
        mrp: parsedMrp !== null && Number.isFinite(parsedMrp) && parsedMrp >= 0 ? parsedMrp : null,
        is_active: true,
        display_order: 0,
      });
    }

    const toUpsert = Array.from(unique.values());
    if (toUpsert.length === 0) {
      toast.error(`No valid rows. ${skipped} skipped (missing name/company or unknown company).`);
      return;
    }

    setUploadingImport(true);
    let processed = 0;
    let errors = 0;
    const errorRows: string[] = [];
    const BATCH = 500;

    for (let i = 0; i < toUpsert.length; i += BATCH) {
      const batch = toUpsert.slice(i, i + BATCH);
      const { error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'company_id,slug', ignoreDuplicates: false });

      if (error) {
        errors += batch.length;
        errorRows.push(`Rows ${i + 2}-${i + batch.length + 1}: ${error.message}`);
        continue;
      }
      processed += batch.length;
    }

    setUploadingImport(false);
    setImportOpen(false);
    if (fileRef.current) fileRef.current.value = '';
    loadProducts();

    if (errors > 0) {
      toast.error(`Import completed with ${errors} rows failed. ${processed} processed. ${skipped} skipped.`, { duration: 7000 });
      console.error('CSV import errors:', errorRows);
    } else {
      toast.success(`Import complete: ${processed} processed${duplicateRows ? `, ${duplicateRows} duplicate CSV rows collapsed` : ''}${skipped ? `, ${skipped} skipped` : ''}`);
    }
  }

  const [uploadingImport, setUploadingImport] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const companyOptions = companies;

  function downloadTemplate() {
    const csv = 'name,company,packing,category,mrp\nPantocid 40,Sun Pharma,15 Tablets,Pharmaceuticals,45\nPantocid DSR,Sun Pharma,10 Capsules,Pharmaceuticals,60\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kamal-products-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your product catalogue. Each product inherits its discount from its company.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={openNew} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="all">All companies</option>
          {companyOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{total} products{companyFilter !== 'all' ? ' in selected company' : ''}</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">No products found. Add one or import a CSV.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Company</th>
                    <th className="px-3 py-3 font-medium text-muted-foreground">Packing</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">MRP</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.company_name ?? '—'}</td>
                      <td className="px-3 py-3 text-muted-foreground">{p.packing ?? '—'}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{p.mrp != null ? `₹${p.mrp.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => toggleActive(p)} className={cn('rounded-md px-2 py-0.5 text-xs font-medium', p.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(p)} title="Edit" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(p)} title="Delete" className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="h-9 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent disabled:opacity-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="h-9 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-background shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-4">
              <h2 className="font-serif text-lg font-semibold">{editing.id ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <Field label="Product Name" required>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} className={inputCls} placeholder="Pantocid 40" />
              </Field>
              <Field label="Company" required>
                <select value={editing.company_id} onChange={(e) => setEditing({ ...editing, company_id: e.target.value })} className={inputCls}>
                  <option value="">Select a company…</option>
                  {companyOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Slug" hint="Auto-generated from name.">
                <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className={inputCls} placeholder="pantocid-40" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Packing">
                  <input value={editing.packing} onChange={(e) => setEditing({ ...editing, packing: e.target.value })} className={inputCls} placeholder="15 Tablets" />
                </Field>
                <Field label="Category">
                  <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="MRP (₹)">
                  <input type="number" min={0} step="0.01" value={editing.mrp} onChange={(e) => setEditing({ ...editing, mrp: e.target.value })} className={inputCls} placeholder="45" />
                </Field>
                <Field label="Display Order">
                  <input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="h-4 w-4 rounded border-border" />
                Active (visible in catalogue)
              </label>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background px-5 py-4">
              <button onClick={() => setEditing(null)} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editing.id ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import dialog */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !uploadingImport && setImportOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl border border-border bg-background p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Import Products (CSV)</h2>
              <button onClick={() => setImportOpen(false)} disabled={uploadingImport} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Upload a CSV file with columns: <strong className="text-foreground">name, company, packing, category, mrp</strong>. The <strong className="text-foreground">company</strong> name must match an existing company exactly.</p>
              <p>This is the fastest way to add thousands of products. Discounts are not included — they come from the company.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImport}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {uploadingImport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingImport ? 'Importing…' : 'Choose CSV file'}
              </button>
              <button onClick={downloadTemplate} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent">
                <Download className="h-4 w-4" /> Download template
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCsvFile(f);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-semibold">Deactivate {confirmDelete.name}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This hides the product from the public catalogue without deleting it.</p>
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

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (field || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
        if (ch === '\r' && text[i + 1] === '\n') i++;
      } else field += ch;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
