export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { ListResponse, CategoryDto } from '../../types';
import { listCategories, ListCategoriesParamsSchema } from '../../lib/services/categories.service';
import { logger, type LogContext } from '../../lib/logger';
import { UnauthorizedError, ValidationError, createErrorResponse, createSuccessResponse } from '../../lib/api-error';

const QuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    sort: z.enum(['sort_order', 'name']).default('sort_order'),
    order: z.enum(['asc', 'desc']).default('asc'),
  })
  .transform((v) => ({
    search: v.search,
    sort: v.sort,
    order: v.order,
  }));

export const GET: APIRoute = async (context) => {
  const startTime = Date.now();
  const { locals, url, request } = context;

  // Create log context
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

    // Categories are public - no user authentication required

    // Parse and validate query parameters
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      const error = new ValidationError('Invalid query parameters', parsed.error.flatten());
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    // Validate with service schema
    const params = ListCategoriesParamsSchema.parse(parsed.data);
    const result = await listCategories(params, supabase);

    const body: ListResponse<CategoryDto> = { items: result.items };

    // Log successful request
    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(body);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (err instanceof ValidationError || err instanceof UnauthorizedError) {
      logger.logRequest(logContext, { status: err.statusCode, latency, error: err });
      return createErrorResponse(err);
    }

    // Unexpected error
    logger.logUnexpectedError(logContext, err);
    logger.logRequest(logContext, { status: 500, latency, error: err });
    return createErrorResponse(err, true); // Sanitize error message
  }
};
