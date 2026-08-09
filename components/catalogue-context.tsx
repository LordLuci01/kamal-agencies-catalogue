'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { CatalogueMode } from '@/lib/supabase/client';

const CatalogueContext = createContext<{ mode: CatalogueMode }>({ mode: 'retail' });

export function CatalogueProvider({
  mode,
  children,
}: {
  mode: CatalogueMode;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ mode }), [mode]);
  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogueMode(): CatalogueMode {
  return useContext(CatalogueContext).mode;
}
