export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { CategoryDto } from '../../../types';
import { getCategoryById } from '../../../lib/services/categories.service';
import { logger, type LogContext } from '../../../lib/logger';
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  createErrorResponse,
  createSuccessResponse,
} from '../../../lib/api-error';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export const GET: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, params, url, request } = context;

  const logContext: LogContext = {
    requestId: locals.requestId,
    userId: locals.userId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
  };

  try {
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError('Missing auth context');
    }

    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      const error = new ValidationError('Invalid category ID', parsed.error.flatten());
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const category = await getCategoryById(parsed.data.id, supabase);
    if (!category) {
      throw new NotFoundError('Category');
    }

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(category);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (err instanceof ValidationError || err instanceof UnauthorizedError || err instanceof NotFoundError) {
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
