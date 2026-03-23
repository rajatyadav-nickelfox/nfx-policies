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
