import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  retail_discount: number;
  wholesale_discount: number;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  packing: string | null;
  category: string | null;
  mrp: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductWithCompany = Product & {
  company: { id: string; name: string; slug: string } | null;
};

export type CompanyWithCount = Company & {
  product_count?: number;
};

export const CATEGORIES = [
  'Pharmaceuticals',
  'Generics',
  'OTC',
  'Surgical',
  'Baby Care',
  'Nutrition',
] as const;

export type CatalogueMode = 'retail' | 'wholesale';
