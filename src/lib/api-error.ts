/**
 * Standardized API error responses and error handling utilities
 */

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Common API errors
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, "ValidationError", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Missing or invalid authentication") {
    super(401, "Unauthorized", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Access forbidden") {
    super(403, "Forbidden", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = "Resource") {
    super(404, "NotFound", `${resource} not found`);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, "Conflict", message);
  }
}

export class UnprocessableError extends ApiError {
  constructor(message: string, details?: any) {
    super(422, "Unprocessable", message, details);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = "An unexpected error occurred") {
    super(500, "InternalServerError", message);
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error,
  sanitize: boolean = true
): Response {
  if (error instanceof ApiError) {
    return new Response(JSON.stringify(error.toJSON()), {
      status: error.statusCode,
      headers: { "content-type": "application/json" },
    });
  }

  // For unexpected errors, don't expose internal details in production
  const message = sanitize
    ? "An unexpected error occurred"
    : error.message;

  return new Response(
    JSON.stringify({
      error: {
        code: "InternalServerError",
        message,
      },
    }),
    {
      status: 500,
      headers: { "content-type": "application/json" },
    }
  );
}

/**
 * Create a success response
 */
export function createSuccessResponse(
  data: any,
  status: number = 200,
  headers?: Record<string, string>
): Response {
  const responseHeaders = new Headers({
    "content-type": "application/json",
    ...headers,
  });

  return new Response(
    status === 204 ? null : JSON.stringify(data),
    {
      status,
      headers: responseHeaders,
    }
  );
}
