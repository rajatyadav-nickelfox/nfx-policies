# Task 03 — Authentication (NextAuth + Azure AD + Supabase Sync)

## Goal

Implement Microsoft SSO using NextAuth.js v5 with the Microsoft Entra ID provider. Enforce that only org-domain emails can sign in. On first login, upsert the user into Supabase. Protect all dashboard routes via Next.js middleware.

---

## Files to Create / Modify

- `lib/auth.ts` — NextAuth configuration
- `lib/env.ts` — validated environment variables
- `app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
- `middleware.ts` — route protection
- `types/next-auth.d.ts` — session type augmentation
- `features/auth/components/LoginButton.tsx`
- `features/auth/components/SessionGuard.tsx`
- `features/auth/hooks/useSession.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/layout.tsx`

---

## Step-by-Step Tasks

### 1. Validated env vars — `lib/env.ts`

This must be imported before anything else that reads `process.env`. The app crashes on startup with a descriptive error if any required variable is missing.

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(1),
  AZURE_AD_CLIENT_ID: z.string().min(1),
  AZURE_AD_CLIENT_SECRET: z.string().min(1),
  AZURE_AD_TENANT_ID: z.string().min(1),
  SHAREPOINT_SITE_ID: z.string().min(1),
  SHAREPOINT_DRIVE_ID: z.string().min(1),
  SHAREPOINT_FOLDER_ID: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ORG_DOMAIN: z.string().min(1),
  DEFAULT_ORG_ID: z.string().uuid(),
});

export const env = envSchema.parse(process.env);
```

### 2. NextAuth configuration — `lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { env } from '@/lib/env';
import { createSupabaseServerAdmin } from '@/services/supabase/server';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: env.AZURE_AD_CLIENT_ID,
      clientSecret: env.AZURE_AD_CLIENT_SECRET,
      tenantId: env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope:
            'openid profile email offline_access User.Read Files.Read.All Sites.Read.All',
        },
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ account, profile }) {
      const email = (profile?.email ?? '').toLowerCase();

      // Reject users not from the organisation domain
      if (!email.endsWith(`@${env.ORG_DOMAIN}`)) {
        return false;
      }

      // Upsert user record in Supabase
      const supabase = createSupabaseServerAdmin();
      await supabase.from('users').upsert(
        {
          azure_object_id: profile?.sub,
          email,
          display_name: profile?.name ?? null,
          organization_id: env.DEFAULT_ORG_ID,
          onboarded_at: new Date().toISOString(),
        },
        { onConflict: 'azure_object_id' }
      );

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.azureOid = (profile as { sub?: string })?.sub;
      }

      // Refresh access token if expired
      if (token.expiresAt && Date.now() / 1000 > (token.expiresAt as number) - 60) {
        token = await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.azureOid = token.azureOid as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
});

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const url = `https://login.microsoftonline.com/${env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.AZURE_AD_CLIENT_ID,
        client_secret: env.AZURE_AD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });
    const refreshed = await response.json();
    if (!response.ok) throw refreshed;
    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
```

### 3. NextAuth route handler — `app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

### 4. Middleware — `middleware.ts`

```typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const isAuthRoute = pathname.startsWith('/login');
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/pdf.worker');

  if (isPublicAsset || isApiAuthRoute) return NextResponse.next();

  if (!isAuthenticated && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/policies', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.js).*)'],
};
```

### 5. Type augmentation — `types/next-auth.d.ts`

```typescript
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      azureOid: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    azureOid?: string;
    error?: string;
  }
}
```

### 6. Login page — `app/(auth)/layout.tsx`

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  );
}
```

### 7. Login page — `app/(auth)/login/page.tsx`

```typescript
import { LoginButton } from '@/features/auth/components/LoginButton';

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-8 shadow-md">
      <h1 className="mb-2 text-2xl font-semibold text-text-primary">Welcome</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Sign in with your organisation account to access company policies.
      </p>
      <LoginButton />
    </div>
  );
}
```

### 8. LoginButton — `features/auth/components/LoginButton.tsx`

```typescript
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
```

### 9. useSession hook — `features/auth/hooks/useSession.ts`

```typescript
import { useSession as useNextAuthSession } from 'next-auth/react';

export function useSession() {
  const { data: session, status } = useNextAuthSession();
  return {
    session,
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
```

### 10. SessionGuard — `features/auth/components/SessionGuard.tsx`

Client component that wraps the QueryClientProvider and SessionProvider for the dashboard layout.

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export function SessionGuard({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
```

---

## Azure AD App Registration Checklist

In the Azure portal, the app registration must have:
- **Redirect URIs** (Web):
  - `http://localhost:3000/api/auth/callback/microsoft-entra-id`
  - `https://<your-vercel-domain>/api/auth/callback/microsoft-entra-id`
- **API Permissions** (Delegated):
  - `openid`, `profile`, `email`, `offline_access`
  - `User.Read`
  - `Files.Read.All`
  - `Sites.Read.All`
- **Client secret** created and stored in `.env.local`

---

## Acceptance Criteria

- [ ] Visiting `/policies` without a session redirects to `/login`
- [ ] Clicking "Sign in with Microsoft" initiates OAuth flow
- [ ] Login with an org email (`@nickelfox.com`) succeeds and lands on `/policies`
- [ ] Login with an external email is rejected (returns to `/login`)
- [ ] After successful login, a row exists in Supabase `users` table
- [ ] Revisiting `/login` while authenticated redirects to `/policies`
- [ ] Session `accessToken` is available for Graph API calls
