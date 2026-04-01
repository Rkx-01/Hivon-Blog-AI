import { createBrowserClient } from '@supabase/ssr';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // Supabase requires valid URL — only create client when real values are present
  if (!url || !url.startsWith('http') || !key) {
    // Return a no-op proxy that won't throw during static build
    return {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: null }),
        signUp: async () => ({ data: { user: null }, error: null }),
        signOut: async () => {},
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => ({
        select: () => ({ order: () => ({ data: null, error: null }), eq: () => ({ single: () => ({ data: null, error: null }), data: null, error: null }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }), error: null }),
        update: () => ({ eq: () => ({ error: null }) }),
        delete: () => ({ eq: () => ({ error: null }) }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>;
  }
  _client = createBrowserClient(url, key);
  return _client;
}
