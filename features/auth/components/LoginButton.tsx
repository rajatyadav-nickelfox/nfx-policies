'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function LoginButton() {
  return (
    <Button
      onClick={() => signIn('microsoft-entra-id', { callbackUrl: '/policies' })}
      className="w-full"
    >
      Sign in with Microsoft
    </Button>
  );
}
