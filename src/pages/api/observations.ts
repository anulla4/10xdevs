export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { ListResponse, ObservationDto } from '../../types';
import { listObservations, ListParamsSchema, createObservation } from '../../lib/services/observations.service';
import { logger, type LogContext } from '../../lib/logger';
import { UnauthorizedError, ValidationError, createErrorResponse, createSuccessResponse } from '../../lib/api-error';

// Schema for POST request body
const CreateObservationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  category_id: z.string().uuid(),
  observation_date: z.string().datetime(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  location_source: z.string().nullable().optional(),
  location_accuracy: z.number().min(0).max(999.99).nullable().optional(),
  is_favorite: z.boolean().optional(),
});

const QuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().min(1).optional(),
    favorite: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    category_id: z.string().uuid().optional(),
    sort: z.enum(['observation_date', 'name', 'created_at']).default('observation_date'),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .transform((v) => ({
    ...v,
    order: v.order ?? (v.sort === 'observation_date' ? 'desc' : 'asc'),
  }));

export const GET: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, url, request } = context;

  const logContext: LogContext = {
    requestId: locals.requestId,
    userId: locals.userId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
  };

  try {
    const supabase = locals.supabase;
    const userId = locals.userId;
    if (!supabase || !userId) {
      throw new UnauthorizedError('Missing auth context');
    }

    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      const error = new ValidationError('Invalid query parameters', parsed.error.flatten());
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const params = ListParamsSchema.parse(parsed.data);
    const { items, total } = await listObservations(params, supabase);

    const body: ListResponse<ObservationDto> = { items };
    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(body, 200, {
      'X-Total-Count': String(total),
      'X-Page': String(params.page),
      'X-Limit': String(params.limit),
    });
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (err instanceof ValidationError || err instanceof UnauthorizedError) {
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

export const POST: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, url, request } = context;

  const logContext: LogContext = {
    requestId: locals.requestId,
    userId: locals.userId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
  };

  try {
    const supabase = locals.supabase;
    const userId = locals.userId;
    if (!supabase || !userId) {
      throw new UnauthorizedError('Missing auth context');
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    // Validate request body
    const parsed = CreateObservationSchema.safeParse(body);
    if (!parsed.success) {
      const error = new ValidationError('Invalid request body', parsed.error.flatten());
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const observation = await createObservation(userId, parsed.data, supabase);

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 201, latency });

    return createSuccessResponse(observation, 201);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (err instanceof ValidationError || err instanceof UnauthorizedError) {
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
