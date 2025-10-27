export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { ProfileDto } from '../../../types';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../../../lib/services/profile.service';
import { logger, type LogContext } from '../../../lib/logger';
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  createErrorResponse,
  createSuccessResponse,
} from '../../../lib/api-error';

const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(60).optional(),
  avatar_url: z.string().url().nullable().optional(),
});

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
    if (!supabase) {
      throw new UnauthorizedError('Missing auth context');
    }

    // For now, we use the test user ID from seed data
    // TODO: Get user ID from JWT token when auth is implemented
    const userId = '00000000-0000-0000-0000-000000000001';

    const profile = await getCurrentUserProfile(userId, supabase);
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(profile);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (err instanceof UnauthorizedError || err instanceof NotFoundError) {
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
    if (!supabase) {
      throw new UnauthorizedError('Missing auth context');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      const error = new ValidationError('Invalid request body', parsed.error.flatten());
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const userId = '00000000-0000-0000-0000-000000000001';
    const profile = await updateCurrentUserProfile(userId, parsed.data, supabase);

    if (!profile) {
      throw new NotFoundError('Profile');
    }

    const latency = Date.now() - startTime;
    logger.logRequest(logContext, { status: 200, latency });

    return createSuccessResponse(profile);
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
