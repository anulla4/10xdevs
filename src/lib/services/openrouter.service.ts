import type {
  ChatRequest,
  ChatResult,
  ChatChunk,
  OpenRouterMessage,
  OpenRouterParams,
  ResponseFormat,
} from '../../types';
import { ApiError, InternalServerError } from '../api-error';
import { z } from 'zod';

export interface OpenRouterConfig {
  baseUrl?: string; // default 'https://openrouter.ai/api/v1'
  defaultModel: string; // e.g., 'openrouter/auto' or specific model
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    seed?: number;
  };
  appName?: string; // for X-Title header
  appUrl?: string; // for HTTP-Referer header
  timeoutMs?: number; // e.g., 60_000
  maxRetries?: number; // e.g., 2-3
}

/**
 * OpenRouter Service - handles LLM chat completions via OpenRouter API
 * Server-side only - never expose API keys to the client
 */
export class OpenRouterService {
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly defaultParams?: OpenRouterParams;
  private readonly appName?: string;
  private readonly appUrl?: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    private readonly apiKey: string,
    cfg: OpenRouterConfig
  ) {
    if (!apiKey) {
      throw new InternalServerError('OpenRouter API key is required');
    }

    this.baseUrl = cfg.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.defaultModel = cfg.defaultModel;
    this.defaultParams = cfg.defaultParams;
    this.appName = cfg.appName;
    this.appUrl = cfg.appUrl;
    this.timeoutMs = cfg.timeoutMs ?? 60_000;
    this.maxRetries = cfg.maxRetries ?? 2;
  }

  /**
   * Generate a non-streaming chat completion
   * @param input - Chat request with system/user messages, model, params, response_format
   * @returns Chat result with content and raw response
   */
  async generateChat(input: ChatRequest): Promise<ChatResult> {
    const messages = this.buildMessages(input);
    const model = input.model ?? this.defaultModel;
    const params = { ...this.defaultParams, ...input.params };

    const body = {
      model,
      messages,
      response_format: input.response_format,
      ...params,
      stream: false,
    };

    const response = await this.request('/chat/completions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      this.handleError(response, errorBody);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? '';

    return {
      content,
      raw: json,
    };
  }

  /**
   * Generate a streaming chat completion
   * @param input - Chat request with system/user messages, model, params, response_format
   * @returns Async iterable of chat chunks
   */
  async *streamChat(input: ChatRequest): AsyncIterable<ChatChunk> {
    const messages = this.buildMessages(input);
    const model = input.model ?? this.defaultModel;
    const params = { ...this.defaultParams, ...input.params };

    const body = {
      model,
      messages,
      response_format: input.response_format,
      ...params,
      stream: true,
    };

    const response = await this.request('/chat/completions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      this.handleError(response, errorBody);
    }

    if (!response.body) {
      throw new InternalServerError('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { delta: '', done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                yield { delta, done: false };
              }
            } catch {
              // Skip malformed JSON chunks
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Validate structured response content against a Zod schema
   * @param content - JSON string content from the model
   * @param schema - Zod schema to validate against
   * @returns Parsed and validated object
   */
  validateStructured<T>(content: string, schema: z.ZodSchema<T>): T {
    try {
      const parsed = JSON.parse(content);
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(422, 'ValidationError', 'Response does not match expected schema', error.errors);
      }
      throw new ApiError(422, 'ParseError', 'Failed to parse JSON response');
    }
  }

  /**
   * Build messages array from ChatRequest
   * @param params - Chat request parameters
   * @returns Array of OpenRouter messages
   */
  buildMessages(params: ChatRequest): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    // Add system message if provided
    if (params.system) {
      messages.push({ role: 'system', content: params.system });
    }

    // Add user message(s)
    if (typeof params.user === 'string') {
      messages.push({ role: 'user', content: params.user });
    } else {
      messages.push(...params.user);
    }

    return messages;
  }

  /**
   * Create a new instance with different model/params (useful for per-task configuration)
   * @param model - Override model
   * @param params - Override parameters
   * @returns New OpenRouterService instance
   */
  withModel(model?: string, params?: Partial<OpenRouterParams>): OpenRouterService {
    return new OpenRouterService(this.apiKey, {
      baseUrl: this.baseUrl,
      defaultModel: model ?? this.defaultModel,
      defaultParams: { ...this.defaultParams, ...params },
      appName: this.appName,
      appUrl: this.appUrl,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
    });
  }

  /**
   * Make an HTTP request to OpenRouter API with retry logic
   * @param path - API path (e.g., '/chat/completions')
   * @param init - Fetch init options
   * @param retry - Current retry attempt
   * @returns Response object
   */
  private async request(path: string, init: RequestInit, retry = 0): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const signal = this.toAbortSignal(this.timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal });

      // Retry on rate limit or server errors
      if ((response.status === 429 || response.status >= 500) && retry < this.maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.calculateBackoff(retry);

        await this.sleep(delayMs);
        return this.request(path, init, retry + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (retry < this.maxRetries && this.isRetryableError(error)) {
        const delayMs = this.calculateBackoff(retry);
        await this.sleep(delayMs);
        return this.request(path, init, retry + 1);
      }

      // Timeout or network error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Timeout', 'Request timeout');
      }

      throw new ApiError(503, 'NetworkError', 'Network request failed');
    }
  }

  /**
   * Get headers for OpenRouter API requests
   * @returns Headers object
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.appUrl) {
      headers['HTTP-Referer'] = this.appUrl;
    }

    if (this.appName) {
      headers['X-Title'] = this.appName;
    }

    return headers;
  }

  /**
   * Create an AbortSignal with timeout
   * @param timeoutMs - Timeout in milliseconds
   * @returns AbortSignal
   */
  private toAbortSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
  }

  /**
   * Handle error responses from OpenRouter API
   * @param resp - Response object
   * @param body - Parsed error body
   * @throws ApiError
   */
  private handleError(resp: Response, body?: any): never {
    const status = resp.status;
    const message = body?.error?.message ?? resp.statusText ?? 'Unknown error';

    // Map HTTP status codes to appropriate errors
    if (status === 401 || status === 403) {
      throw new ApiError(500, 'AuthenticationError', 'OpenRouter authentication failed');
    }

    if (status === 400) {
      throw new ApiError(400, 'BadRequest', message, body?.error);
    }

    if (status === 404) {
      throw new ApiError(404, 'ModelNotFound', 'Requested model not found or unavailable');
    }

    if (status === 409) {
      throw new ApiError(409, 'Conflict', message, body?.error);
    }

    if (status === 429) {
      throw new ApiError(429, 'RateLimitExceeded', 'Rate limit exceeded');
    }

    if (status >= 500) {
      throw new ApiError(502, 'ProviderError', 'OpenRouter service error');
    }

    throw new ApiError(status, 'UnknownError', message);
  }

  /**
   * Calculate exponential backoff delay
   * @param retry - Current retry attempt
   * @returns Delay in milliseconds
   */
  private calculateBackoff(retry: number): number {
    // 500ms, 1500ms, 3500ms
    return 500 * Math.pow(3, retry);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable (network errors, timeouts)
   * @param error - Error object
   * @returns True if retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const retryableErrors = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
      return retryableErrors.some((code) => error.message.includes(code));
    }
    return false;
  }

  /**
   * Redact sensitive information from logs
   * @param obj - Object to redact
   * @returns Redacted object
   */
  private redact(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const redacted = { ...obj } as any;
    const sensitiveKeys = ['apiKey', 'api_key', 'authorization', 'token', 'password', 'secret'];

    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = this.redact(redacted[key]);
      }
    }

    return redacted;
  }
}
