'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { slugify } from '@/lib/slugify';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function LogoUpload({
  value,
  onChange,
  folder = 'companies',
  nameHint,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  nameHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const base = slugify(nameHint || 'logo') || 'logo';
    const path = `${folder}/${base}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('company-assets')
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (upErr) {
      toast.error('Upload failed: ' + upErr.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from('company-assets').getPublicUrl(path);
    onChange(pub.publicUrl);
    toast.success('Logo uploaded');
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo preview" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex h-8 items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <p className={cn('text-xs text-muted-foreground')}>PNG, JPG, WebP or SVG. Max 2 MB.</p>
    </div>
  );
}
