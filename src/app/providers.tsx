'use client';

import { SessionProvider } from 'next-auth/react';
import AuthGuard from '@/components/AuthGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}
