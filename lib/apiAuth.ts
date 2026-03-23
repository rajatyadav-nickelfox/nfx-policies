import { auth } from '@/lib/auth';
import { createSupabaseServerAdmin } from '@/services/supabase/server';

export async function requireAuth() {
  const session = await auth();
  if (!session?.accessToken) {
    return {
      session: null,
      supabase: null,
      error: new Response('Unauthorized', { status: 401 }),
    };
  }
  const supabase = createSupabaseServerAdmin();
  return { session, supabase, error: null };
}
