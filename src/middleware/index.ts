import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";
import { generateRequestId } from "../lib/logger.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Generate unique request ID for tracking
  const requestId = generateRequestId();
  context.locals.requestId = requestId;

  // Add Supabase client to context
  context.locals.supabase = supabaseClient;

  // TODO: Extract user ID from JWT token when auth is implemented
  // For now, we use a test user ID in endpoints
  context.locals.userId = undefined;

  // Add request ID to response headers for debugging
  const response = next();
  response.then((res) => {
    res.headers.set("X-Request-ID", requestId);
  });

  return response;
});
