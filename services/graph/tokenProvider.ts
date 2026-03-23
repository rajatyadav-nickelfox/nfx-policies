import { auth } from '@/lib/auth';

export async function getGraphAccessToken(): Promise<string> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error('No Graph access token in session. User may not be authenticated.');
  }
  return session.accessToken;
}
