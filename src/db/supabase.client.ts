import { createClient, type SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side Supabase client (for existing services)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed Supabase client for use in services
export type SupabaseClient = SupabaseClientBase<Database>;

// Cookie options for SSR
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: 'lax',
};

// Helper to parse cookie header
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

// Server-side Supabase client factory (for auth)
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, { ...cookieOptions, ...options }),
          );
        },
      },
    },
  );

  return supabase;
};
