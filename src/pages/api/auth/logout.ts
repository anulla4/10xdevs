import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { authLogger } from '../../../lib/auth-logger';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get current user (if any)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      authLogger.error('Logout failed', {
        requestId: locals.requestId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: 'Nie udało się wylogować. Spróbuj ponownie.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (user) {
      authLogger.info('User logged out successfully', {
        requestId: locals.requestId,
        userId: user.id,
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    authLogger.error('Logout endpoint error', {
      requestId: locals.requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new Response(
      JSON.stringify({
        error: 'Wystąpił błąd serwera. Spróbuj ponownie.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
