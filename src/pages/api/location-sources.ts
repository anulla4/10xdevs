export const prerender = false;

import type { APIRoute } from "astro";
import type { ListResponse, LocationSourceDto } from "../../types";
import { listLocationSources } from "../../lib/services/location-sources.service";
import { logger, type LogContext } from "../../lib/logger";
import {
  UnauthorizedError,
  createErrorResponse,
  createSuccessResponse,
} from "../../lib/api-error";

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

    const result = await listLocationSources(supabase);
    const body: ListResponse<LocationSourceDto> = { items: result.items };

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(body);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (err instanceof UnauthorizedError) {
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
