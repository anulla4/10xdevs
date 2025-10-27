export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { ChatRequest, ChatResult } from '../../../types';
import { OpenRouterService } from '../../../lib/services/openrouter.service';
import { logger, type LogContext } from '../../../lib/logger';
import {
  ValidationError,
  InternalServerError,
  createErrorResponse,
  createSuccessResponse,
} from '../../../lib/api-error';

// Zod schema for request body validation
const ChatRequestSchema = z.object({
  system: z.string().min(1).optional(),
  user: z.union([
    z.string().min(1),
    z.array(
      z.object({
        role: z.enum(['system', 'user', 'assistant', 'tool']),
        content: z.string(),
      })
    ),
  ]),
  model: z.string().optional(),
  params: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().positive().optional(),
      top_p: z.number().min(0).max(1).optional(),
      presence_penalty: z.number().min(-2).max(2).optional(),
      frequency_penalty: z.number().min(-2).max(2).optional(),
      seed: z.number().int().optional(),
    })
    .optional(),
  response_format: z
    .object({
      type: z.literal('json_schema'),
      json_schema: z.object({
        name: z.string(),
        strict: z.literal(true),
        schema: z.record(z.unknown()),
      }),
    })
    .optional(),
});

export const POST: APIRoute = async (context) => {
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
    // Check for API key in environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      logger.logUnexpectedError(logContext, new Error('OPENROUTER_API_KEY not configured'));
      throw new InternalServerError('AI service not configured');
    }

    // Parse and validate request body
    const rawBody = await request.json().catch(() => {
      throw new ValidationError('Invalid JSON body');
    });

    const parsed = ChatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const error = new ValidationError('Invalid request parameters', parsed.error.flatten());
      logger.logValidationError(logContext, error.details);
      throw error;
    }

    const chatRequest: ChatRequest = parsed.data;

    // Create OpenRouter service instance
    const service = new OpenRouterService(apiKey, {
      defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL ?? 'google/gemini-flash-1.5',
      appUrl: import.meta.env.OPENROUTER_APP_URL,
      appName: import.meta.env.OPENROUTER_APP_NAME ?? 'Nature Log',
      timeoutMs: 60_000,
      maxRetries: 2,
    });

    // Generate chat completion
    const result: ChatResult = await service.generateChat(chatRequest);

    // Log successful request with model info
    const latency = Date.now() - startTime;
    logger.logRequest(logContext, {
      status: 200,
      latency,
      details: {
        model: chatRequest.model ?? service['defaultModel'],
        hasResponseFormat: !!chatRequest.response_format,
        temperature: chatRequest.params?.temperature,
      },
    });

    return createSuccessResponse(result);
  } catch (err: any) {
    const latency = Date.now() - startTime;

    if (err instanceof ValidationError || err instanceof InternalServerError) {
      logger.logRequest(logContext, {
        status: err.statusCode,
        latency,
        error: err,
      });
      return createErrorResponse(err);
    }

    // Unexpected error
    logger.logUnexpectedError(logContext, err);
    logger.logRequest(logContext, { status: 500, latency, error: err });
    return createErrorResponse(err, true); // Sanitize error message
  }
};
