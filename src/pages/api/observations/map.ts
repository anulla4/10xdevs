export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { getObservationMarkers } from "../../../lib/services/observations.service";
import { logger, type LogContext } from "../../../lib/logger";
import {
  UnauthorizedError,
  ValidationError,
  UnprocessableError,
  createErrorResponse,
  createSuccessResponse,
} from "../../../lib/api-error";

const QuerySchema = z.object({
  min_lat: z.coerce.number().min(-90).max(90).optional(),
  min_lng: z.coerce.number().min(-180).max(180).optional(),
  max_lat: z.coerce.number().min(-90).max(90).optional(),
  max_lng: z.coerce.number().min(-180).max(180).optional(),
  category_id: z.string().uuid().optional(),
  favorite: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

export const GET: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, url, request } = context;

  const logContext: LogContext = {
    requestId: locals.requestId,
    userId: locals.userId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get("user-agent") || undefined,
  };

  try {
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError("Missing auth context");
    }

    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      const error = new ValidationError(
        "Invalid query parameters",
        parsed.error.flatten()
      );
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    // Validate bbox if partially provided
    const { min_lat, min_lng, max_lat, max_lng } = parsed.data;
    const bboxProvided = [min_lat, min_lng, max_lat, max_lng].some(
      (v) => v !== undefined
    );
    const bboxComplete = [min_lat, min_lng, max_lat, max_lng].every(
      (v) => v !== undefined
    );

    if (bboxProvided && !bboxComplete) {
      throw new ValidationError(
        "Bounding box requires all four coordinates: min_lat, min_lng, max_lat, max_lng"
      );
    }

    // Validate bbox ranges
    if (bboxComplete && (min_lat! >= max_lat! || min_lng! >= max_lng!)) {
      throw new UnprocessableError(
        "Invalid bounding box: min values must be less than max values"
      );
    }

    const result = await getObservationMarkers(parsed.data, supabase);

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(result);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (
      err instanceof ValidationError ||
      err instanceof UnauthorizedError ||
      err instanceof UnprocessableError
    ) {
      logger.logRequest(logContext, {
        status: err.statusCode,
        latency,
        error: err,
      });
      return createErrorResponse(err);
    }

    logger.logUnexpectedError(logContext, err);
    logger.logRequest(logContext, { status: 500, latency, error: err });
    return createErrorResponse(err, true);
  }
};
