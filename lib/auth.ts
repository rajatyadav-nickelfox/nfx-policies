import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { env } from '@/lib/env';
import { createSupabaseServerAdmin } from '@/services/supabase/server';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: env.AZURE_AD_CLIENT_ID,
      clientSecret: env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${env.AZURE_AD_TENANT_ID}/v2.0`,
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
    async signIn({ account: _account, profile }) {
      const email = ((profile?.email as string) ?? '').toLowerCase();
      if (!email.endsWith(`@${env.ORG_DOMAIN}`)) return false;

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
    const refreshed = await response.json() as Record<string, unknown>;
    if (!response.ok) throw refreshed;
    return {
      ...token,
      accessToken: refreshed.access_token as string,
      refreshToken: (refreshed.refresh_token as string | undefined) ?? (token.refreshToken as string | undefined),
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in as number),
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
