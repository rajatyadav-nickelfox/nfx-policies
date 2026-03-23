# Task 10 — Deployment Configuration

## Goal

Configure `next.config.ts` with security headers, set up `vercel.json` for function timeouts, and document all environment variable setup steps for Vercel.

---

## Files to Create / Modify

- `next.config.ts`
- `vercel.json`

---

## Step-by-Step Tasks

### 1. `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Increase body size limit for file proxy routes (large PDFs)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  // Disable Next.js image optimization — we don't serve images from Graph
  images: {
    unoptimized: true,
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Limit referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy
          // Note: unsafe-eval and unsafe-inline are required by pdfjs-dist
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "worker-src blob: 'self'",    // required for PDF.js web worker
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // Prevent embedding in iframes
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 2. `vercel.json`

File proxy and DOCX conversion routes may take longer than the default 10s timeout for large files.

```json
{
  "framework": "nextjs",
  "functions": {
    "app/api/policies/[id]/route.ts": {
      "maxDuration": 30
    },
    "app/api/policies/[id]/html/route.ts": {
      "maxDuration": 30
    },
    "app/api/policies/route.ts": {
      "maxDuration": 20
    }
  },
  "crons": []
}
```

---

## Vercel Project Setup Checklist

### Environment Variables

Set all of the following in the Vercel project dashboard under **Settings → Environment Variables**. Apply to Production, Preview, and Development unless noted.

| Variable | Value | Env |
|---|---|---|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production only |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` | All |
| `AZURE_AD_CLIENT_ID` | From Azure App Registration | All |
| `AZURE_AD_CLIENT_SECRET` | From Azure App Registration | All |
| `AZURE_AD_TENANT_ID` | Azure Directory (tenant) ID | All |
| `SHAREPOINT_SITE_ID` | Graph site ID | All |
| `SHAREPOINT_DRIVE_ID` | Graph drive ID | All |
| `SHAREPOINT_FOLDER_ID` | Graph folder item ID | All |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **mark as sensitive** | All |
| `ORG_DOMAIN` | `nickelfox.com` | All |
| `DEFAULT_ORG_ID` | UUID of seeded org row | All |

> `SUPABASE_SERVICE_ROLE_KEY` must be marked as **Sensitive** in Vercel (encrypted, not visible after save). It is server-only and must never appear in browser bundles.

### Azure AD App Registration — Redirect URIs

In the Azure portal, add the following redirect URIs to the app registration under **Authentication → Platform configurations → Web**:

```
http://localhost:3000/api/auth/callback/microsoft-entra-id
https://your-app.vercel.app/api/auth/callback/microsoft-entra-id
```

Replace `your-app.vercel.app` with your actual Vercel deployment URL.

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Link to Vercel project
vercel link

# Deploy to production
vercel --prod
```

Or connect the GitHub repository to Vercel for automatic deployments on push to `main`.

---

## Phase 2: Vercel Cron (Email Reminders)

When implementing Phase 2 email reminders, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Protect the cron route with a secret header:

```typescript
// app/api/cron/send-reminders/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... send reminders logic
}
```

---

## Acceptance Criteria

- [ ] `next build` completes without errors
- [ ] `vercel --prod` deploys successfully
- [ ] Visiting the production URL redirects unauthenticated users to `/login`
- [ ] Microsoft SSO works on the production Vercel URL (redirect URI is registered in Azure AD)
- [ ] `X-Frame-Options: DENY` header is present on all responses (verify in browser DevTools → Network)
- [ ] `Content-Security-Policy` header is present and does not block PDF.js rendering
- [ ] `SUPABASE_SERVICE_ROLE_KEY` does not appear in any client-side bundle (verify with `npx next build && grep -r "service_role" .next/static` — should return nothing)
- [ ] File proxy route returns files within 30 seconds for a 10MB PDF
