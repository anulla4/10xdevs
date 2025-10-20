import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { loginSchema, validateRequest } from "../../../lib/validation/auth.validation";
import { authLogger } from "../../../lib/auth-logger";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateRequest(loginSchema, body);
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

    const { email, password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      authLogger.warn("Login failed", {
        requestId: locals.requestId,
        email,
        error: error.message,
      });

      // Generic error message for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy e-mail lub hasło",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    authLogger.info("User logged in successfully", {
      requestId: locals.requestId,
      userId: data.user.id,
      email: data.user.email,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    authLogger.error("Login endpoint error", {
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
