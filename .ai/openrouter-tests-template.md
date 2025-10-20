# OpenRouter Service - Template testów jednostkowych

## Struktura testów

Testy powinny być umieszczone w:
- `src/lib/services/__tests__/openrouter.service.test.ts`

## Wymagane zależności

```bash
npm install -D vitest @vitest/ui
```

Dodaj do `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Template testów

```ts
// src/lib/services/__tests__/openrouter.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenRouterService } from '../openrouter.service'
import type { ChatRequest } from '../../../types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('OpenRouterService', () => {
  let service: OpenRouterService

  beforeEach(() => {
    service = new OpenRouterService('test-api-key', {
      defaultModel: 'openrouter/auto',
      timeoutMs: 5000,
      maxRetries: 1,
    })
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => {
        new OpenRouterService('', {
          defaultModel: 'openrouter/auto',
        })
      }).toThrow('OpenRouter API key is required')
    })

    it('should initialize with default values', () => {
      const svc = new OpenRouterService('key', {
        defaultModel: 'test-model',
      })

      expect(svc).toBeDefined()
    })

    it('should accept custom configuration', () => {
      const svc = new OpenRouterService('key', {
        baseUrl: 'https://custom.api',
        defaultModel: 'custom-model',
        defaultParams: { temperature: 0.5 },
        appName: 'Test App',
        appUrl: 'https://test.com',
        timeoutMs: 30000,
        maxRetries: 3,
      })

      expect(svc).toBeDefined()
    })
  })

  describe('buildMessages', () => {
    it('should build messages with system and user string', () => {
      const request: ChatRequest = {
        system: 'You are a helpful assistant.',
        user: 'Hello, world!',
      }

      const messages = service.buildMessages(request)

      expect(messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, world!' },
      ])
    })

    it('should build messages with user string only', () => {
      const request: ChatRequest = {
        user: 'Hello, world!',
      }

      const messages = service.buildMessages(request)

      expect(messages).toEqual([
        { role: 'user', content: 'Hello, world!' },
      ])
    })

    it('should build messages with message array', () => {
      const request: ChatRequest = {
        user: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'Response' },
          { role: 'user', content: 'Second message' },
        ],
      }

      const messages = service.buildMessages(request)

      expect(messages).toEqual([
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Second message' },
      ])
    })

    it('should combine system message with message array', () => {
      const request: ChatRequest = {
        system: 'System prompt',
        user: [
          { role: 'user', content: 'User message' },
        ],
      }

      const messages = service.buildMessages(request)

      expect(messages).toEqual([
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' },
      ])
    })
  })

  describe('generateChat', () => {
    it('should generate chat completion successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await service.generateChat({
        user: 'Test prompt',
      })

      expect(result.content).toBe('Test response')
      expect(result.raw).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should use custom model and parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      })

      await service.generateChat({
        user: 'Test',
        model: 'custom-model',
        params: {
          temperature: 0.7,
          max_tokens: 100,
        },
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      expect(body.model).toBe('custom-model')
      expect(body.temperature).toBe(0.7)
      expect(body.max_tokens).toBe(100)
    })

    it('should include response_format when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"key": "value"}' } }],
        }),
      })

      await service.generateChat({
        user: 'Test',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'test_schema',
            strict: true,
            schema: { type: 'object' },
          },
        },
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      expect(body.response_format).toBeDefined()
      expect(body.response_format.type).toBe('json_schema')
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: { message: 'Invalid request' },
        }),
      })

      await expect(
        service.generateChat({ user: 'Test' })
      ).rejects.toThrow('Invalid request')
    })

    it('should retry on 429 rate limit', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '1']]),
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
          }),
        })

      const result = await service.generateChat({ user: 'Test' })

      expect(result.content).toBe('Success after retry')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on 5xx server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
          }),
        })

      const result = await service.generateChat({ user: 'Test' })

      expect(result.content).toBe('Success after retry')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      })

      await expect(
        service.generateChat({ user: 'Test' })
      ).rejects.toThrow()

      // Initial + 1 retry (maxRetries: 1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('validateStructured', () => {
    it('should validate valid JSON against schema', () => {
      const content = JSON.stringify({
        items: [
          { name: 'Item 1', value: 10 },
          { name: 'Item 2', value: 20 },
        ],
      })

      const schema = z.object({
        items: z.array(
          z.object({
            name: z.string(),
            value: z.number(),
          })
        ),
      })

      const result = service.validateStructured(content, schema)

      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe('Item 1')
    })

    it('should throw on invalid JSON', () => {
      const content = 'not valid json'
      const schema = z.object({ key: z.string() })

      expect(() => {
        service.validateStructured(content, schema)
      }).toThrow('Failed to parse JSON response')
    })

    it('should throw on schema validation failure', () => {
      const content = JSON.stringify({ wrong: 'structure' })
      const schema = z.object({ expected: z.string() })

      expect(() => {
        service.validateStructured(content, schema)
      }).toThrow('Response does not match expected schema')
    })
  })

  describe('withModel', () => {
    it('should create new instance with different model', () => {
      const newService = service.withModel('new-model')

      expect(newService).not.toBe(service)
      expect(newService).toBeInstanceOf(OpenRouterService)
    })

    it('should create new instance with different params', () => {
      const newService = service.withModel(undefined, {
        temperature: 0.9,
        max_tokens: 500,
      })

      expect(newService).not.toBe(service)
      expect(newService).toBeInstanceOf(OpenRouterService)
    })

    it('should preserve API key and base config', async () => {
      const newService = service.withModel('new-model')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      })

      await newService.generateChat({ user: 'Test' })

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1].headers

      expect(headers.Authorization).toBe('Bearer test-api-key')
    })
  })

  describe('streamChat', () => {
    it('should stream chat chunks', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      })

      const chunks: string[] = []
      for await (const chunk of service.streamChat({ user: 'Test' })) {
        if (chunk.delta) {
          chunks.push(chunk.delta)
        }
        if (chunk.done) break
      }

      expect(chunks).toEqual(['Hello', ' world'])
    })

    it('should handle stream errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      const generator = service.streamChat({ user: 'Test' })

      await expect(generator.next()).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should map 401 to AuthenticationError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })

      await expect(
        service.generateChat({ user: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'AuthenticationError',
      })
    })

    it('should map 404 to ModelNotFound', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      })

      await expect(
        service.generateChat({ user: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'ModelNotFound',
      })
    })

    it('should map 429 to RateLimitExceeded after retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map(),
        json: async () => ({}),
      })

      await expect(
        service.generateChat({ user: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 429,
        code: 'RateLimitExceeded',
      })
    })
  })
})
```

## Uruchomienie testów

```bash
# Wszystkie testy
npm test

# Z UI
npm run test:ui

# Z coverage
npm run test:coverage

# Watch mode
npm test -- --watch

# Konkretny plik
npm test openrouter.service.test.ts
```

## Konfiguracja Vitest

Utwórz `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
})
```

## Integracja z CI/CD

Dodaj do GitHub Actions (`.github/workflows/test.yml`):

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Mockowanie dla testów integracyjnych

```ts
// src/lib/services/__tests__/mocks/openrouter.mock.ts
import type { ChatResult } from '../../../types'

export class MockOpenRouterService {
  async generateChat(): Promise<ChatResult> {
    return {
      content: 'Mocked response',
      raw: { choices: [{ message: { content: 'Mocked response' } }] },
    }
  }

  async *streamChat() {
    yield { delta: 'Mocked', done: false }
    yield { delta: ' stream', done: false }
    yield { delta: '', done: true }
  }

  buildMessages = vi.fn()
  validateStructured = vi.fn()
  withModel = vi.fn(() => this)
}
```

## Best Practices

1. **Mockuj fetch globalnie** - unikaj rzeczywistych wywołań API w testach
2. **Testuj edge cases** - puste odpowiedzi, błędy parsowania, timeouty
3. **Testuj retry logic** - sprawdź czy retry działa poprawnie
4. **Testuj walidację** - zarówno pozytywne jak i negatywne przypadki
5. **Używaj snapshots** - dla złożonych struktur danych
6. **Izoluj testy** - każdy test powinien być niezależny
7. **Testuj async code** - używaj async/await w testach
