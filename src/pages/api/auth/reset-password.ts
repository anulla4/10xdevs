import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { resetPasswordSchema, validateRequest } from '../../../lib/validation/auth.validation';
import { authLogger } from '../../../lib/auth-logger';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateRequest(resetPasswordSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowe dane',
          details: validation.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get the origin for redirect URL
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/auth/update-password`;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // SECURITY: Always return success, even if email doesn't exist
    // This prevents email enumeration attacks
    if (error) {
      authLogger.warn('Password reset email failed', {
        requestId: locals.requestId,
        email,
        error: error.message,
      });
    } else {
      authLogger.info('Password reset email sent', {
        requestId: locals.requestId,
        email,
      });
    }

    // Always return success
    return new Response(
      JSON.stringify({
        message: 'Jeśli konto z tym adresem e-mail istnieje, link resetujący został wysłany.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    authLogger.error('Reset password endpoint error', {
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
