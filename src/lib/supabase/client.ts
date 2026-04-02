import { createBrowserClient } from '@supabase/ssr';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Use the standard SSR Browser client so that auth tokens natively
  // synchronize to cookies, empowering the Server (middleware) to verify access.
  _client = createBrowserClient(url, key, {
    auth: {
      // Dummy lock adapter explicitly bypassing navigator.locks to prevent
      // Chromium Incognito mode session-retrieval hangs.
      lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
         return fn();
      }
    }
  });

  return _client;
}
