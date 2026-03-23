'use client';

import { signOut } from 'next-auth/react';
import { useSession } from '@/features/auth/hooks/useSession';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  const { user } = useSession();

  return (
    <header
      style={{ height: 'var(--topbar-height)' }}
      className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-6"
    >
      <span className="text-base font-semibold text-text-primary">Company Policies</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">{user?.email}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
