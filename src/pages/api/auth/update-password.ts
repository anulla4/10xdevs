import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { updatePasswordSchema, validateRequest } from "../../../lib/validation/auth.validation";
import { authLogger } from "../../../lib/auth-logger";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateRequest(updatePasswordSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane",
          details: validation.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get current user (must be authenticated via reset token)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      authLogger.warn("Update password failed - no valid session", {
        requestId: locals.requestId,
        error: userError?.message,
      });

      return new Response(
        JSON.stringify({
          error: "Link wygasł lub jest nieprawidłowy. Wygeneruj nowy link.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      authLogger.error("Password update failed", {
        requestId: locals.requestId,
        userId: user.id,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Nie udało się zmienić hasła. Spróbuj ponownie.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    authLogger.info("Password updated successfully", {
      requestId: locals.requestId,
      userId: user.id,
    });

    return new Response(
      JSON.stringify({
        message: "Hasło zostało zmienione pomyślnie.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    authLogger.error("Update password endpoint error", {
      requestId: locals.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd serwera. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
