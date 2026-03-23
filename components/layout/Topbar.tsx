'use client';

import { signOut } from 'next-auth/react';
import { useSession } from '@/features/auth/hooks/useSession';
import { Button } from '@/components/ui/Button';

function UserAvatar({ email }: { email?: string | null }) {
  const initial = email?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
      {initial}
    </div>
  );
}

export function Topbar() {
  const { user } = useSession();

  return (
    <header
      style={{ height: 'var(--topbar-height)' }}
      className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-6 backdrop-blur-sm"
    >
      <span className="text-base font-semibold text-text-primary">Company Policies</span>
      <div className="flex items-center gap-3">
        <UserAvatar email={user?.email} />
        <span className="hidden text-sm text-text-secondary sm:block">{user?.email}</span>
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
