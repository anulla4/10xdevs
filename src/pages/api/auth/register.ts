import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema, validateRequest } from "../../../lib/validation/auth.validation";
import { authLogger } from "../../../lib/auth-logger";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateRequest(registerSchema, body);
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

    // Attempt registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation disabled for MVP
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      authLogger.warn("Registration failed", {
        requestId: locals.requestId,
        email,
        error: error.message,
      });

      // Check for specific errors
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "E-mail jest już zarejestrowany",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta. Spróbuj ponownie.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user was created
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta. Spróbuj ponownie.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    authLogger.info("User registered successfully", {
      requestId: locals.requestId,
      userId: data.user.id,
      email: data.user.email,
    });

    // Auto-login after registration
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    authLogger.error("Registration endpoint error", {
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
