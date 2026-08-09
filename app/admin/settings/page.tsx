'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Image as ImageIcon, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LogoUpload } from '@/components/admin/logo-upload';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('logo_url')
        .eq('id', 1)
        .maybeSingle();
      if (error) { toast.error('Failed to load settings'); }
      setLogoUrl(data?.logo_url ?? '');
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .update({ logo_url: logoUrl || null })
      .eq('id', 1);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Settings saved. Your logo is now live.');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Site Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your Kamal Agencies branding shown across the website.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Website Logo</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          This logo appears in the website header and footer. Upload a square or wide image for best results.
        </p>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : (
          <div className="mt-5">
            <LogoUpload
              value={logoUrl}
              onChange={setLogoUrl}
              folder="site"
              nameHint="kamal-agencies-logo"
            />
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button onClick={handleSave} disabled={saving || loading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
