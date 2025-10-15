export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import type { ObservationDto } from "../../../types";
import {
  getObservationById,
  updateObservation,
  deleteObservation,
} from "../../../lib/services/observations.service";
import { logger, type LogContext } from "../../../lib/logger";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  createErrorResponse,
  createSuccessResponse,
} from "../../../lib/api-error";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const UpdateObservationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  category_id: z.string().uuid().optional(),
  observation_date: z.string().datetime().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  location_source: z.string().nullable().optional(),
  location_accuracy: z.number().min(0).max(999.99).nullable().optional(),
  is_favorite: z.boolean().optional(),
});

export const GET: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, params, url, request } = context;

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

    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      const error = new ValidationError(
        "Invalid observation ID",
        parsed.error.flatten()
      );
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const observation = await getObservationById(parsed.data.id, supabase);
    if (!observation) {
      throw new NotFoundError("Observation");
    }

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(observation);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (
      err instanceof ValidationError ||
      err instanceof UnauthorizedError ||
      err instanceof NotFoundError
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

export const PATCH: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, params, url, request } = context;

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

    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      const error = new ValidationError(
        "Invalid observation ID",
        parsedParams.error.flatten()
      );
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const parsedBody = UpdateObservationSchema.safeParse(body);
    if (!parsedBody.success) {
      const error = new ValidationError(
        "Invalid request body",
        parsedBody.error.flatten()
      );
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const userId = "00000000-0000-0000-0000-000000000001";
    const observation = await updateObservation(
      parsedParams.data.id,
      userId,
      parsedBody.data,
      supabase
    );

    if (!observation) {
      throw new NotFoundError("Observation");
    }

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(observation);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (
      err instanceof ValidationError ||
      err instanceof UnauthorizedError ||
      err instanceof NotFoundError
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

export const DELETE: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, params, url, request } = context;

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

    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      const error = new ValidationError(
        "Invalid observation ID",
        parsed.error.flatten()
      );
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const userId = "00000000-0000-0000-0000-000000000001";
    const deleted = await deleteObservation(parsed.data.id, userId, supabase);

    if (!deleted) {
      throw new NotFoundError("Observation");
    }

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 204, latency });

    return createSuccessResponse(null, 204);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (
      err instanceof ValidationError ||
      err instanceof UnauthorizedError ||
      err instanceof NotFoundError
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
