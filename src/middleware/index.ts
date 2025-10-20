import { defineMiddleware } from "astro:middleware";

import { supabaseClient, createSupabaseServerInstance } from "../db/supabase.client.ts";
import { generateRequestId } from "../lib/logger.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth pages
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/update-password",
  "/auth/logout",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
  // Landing page
  "/",
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Generate unique request ID for tracking
  const requestId = generateRequestId();
  context.locals.requestId = requestId;

  // Add Supabase client to context (for existing services)
  context.locals.supabase = supabaseClient;

  // Create server instance for auth
  const supabaseServer = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Get user session
  const { data: { user } } = await supabaseServer.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    context.locals.user = {
      id: user.id,
      email: user.email,
    };
    context.locals.userId = user.id;
  } else {
    context.locals.user = undefined;
    context.locals.userId = undefined;
  }

  // Check if path requires authentication
  const isPublicPath = PUBLIC_PATHS.some(path => 
    context.url.pathname === path || context.url.pathname.startsWith(path)
  );

  // Redirect to login if trying to access protected route without auth
  if (!isPublicPath && !user) {
    const redirectTo = context.url.pathname + context.url.search;
    return context.redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  // Add request ID to response headers for debugging
  const response = next();
  response.then((res) => {
    res.headers.set("X-Request-ID", requestId);
  });

  return response;
});
