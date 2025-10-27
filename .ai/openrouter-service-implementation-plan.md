# OpenRouter Service – Implementation Guide (Astro + TypeScript)

## 1. Opis usługi

- **Cel**: Zapewnić typowaną usługę do obsługi czatów LLM przez OpenRouter API w aplikacji Nature Log.
- **Zakres**: Budowa serwisu `OpenRouterService` do wykorzystania w endpointach Astro (`src/pages/api/`) i w warstwie usług (`src/lib/services/`).
- **Wymagania**:
  - Zgodność z zasadami w `10xdevs/.windsurfrules` i stackiem z `10xdevs/.ai/tech-stack.md`.
  - Wyłącznie serwerowe użycie klucza API (env), bez ujawniania w kliencie.
  - Obsługa: komunikat systemowy, komunikat użytkownika, response_format (JSON Schema), nazwa modelu, parametry modelu, streaming, retry/backoff, walidacja wyników.

Rekomendowana lokalizacja plików:

- `src/lib/services/openrouter.service.ts` – implementacja serwisu
- `src/types.ts` – wspólne typy (DTO, schematy)
- `src/pages/api/ai/chat.ts` – endpoint HTTP do czatu (POST)

## 2. Opis konstruktora

Tworzymy klasę `OpenRouterService` z konfigiem i zależnościami przekazywanymi jawnie:

```ts
type OpenRouterConfig = {
  baseUrl?: string; // domyślnie 'https://openrouter.ai/api/v1'
  defaultModel: string; // np. 'openrouter/auto' lub jawny model
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    seed?: number;
  };
  appName?: string; // do nagłówka X-Title
  appUrl?: string; // do nagłówka HTTP-Referer
  timeoutMs?: number; // np. 60_000
  maxRetries?: number; // np. 2-3
};

class OpenRouterService {
  constructor(
    private readonly apiKey: string,
    private readonly cfg: OpenRouterConfig
  ) {}
}
```

- **Źródła konfiguracji**:
  - `import.meta.env.OPENROUTER_API_KEY` – pobierany w endpointzie lub middleware i przekazywany do serwisu (nie importować bezpośrednio w komponencie klienckim!).
  - `import.meta.env.OPENROUTER_APP_URL` oraz `import.meta.env.OPENROUTER_APP_NAME` – do nagłówków referencyjnych (opcjonalne, ale zalecane przez OpenRouter).

## 3. Publiczne metody i pola

- **`generateChat(input: ChatRequest): Promise<ChatResult>`**
  - Blokowa generacja odpowiedzi czatowej (non-stream).
  - Uwzględnia: system message, user message, opcjonalne `response_format`, nazwę modelu, parametry modelu.

- **`streamChat(input: ChatRequest): AsyncIterable<ChatChunk>`**
  - Streaming odpowiedzi tokenami (Server-Sent Events / fetch + ReadableStream).

- **`validateStructured<T>(content: string, schema: z.ZodSchema<T>): T`**
  - Waliduje treść odpowiedzi z użyciem schematu (np. Zod), zwracając typowany obiekt.

- **`buildMessages(params: MessageParams): OpenRouterMessage[]`**
  - Konstruuje `messages` w formacie API.

- **`withModel(model?: string, params?: Partial<OpenRouterParams>): OpenRouterService`**
  - Zwraca kopię instancji z innym modelem/parametrami (wygodne per-zadanie).

- **Pola konfiguracyjne (readonly)**: `baseUrl`, `defaultModel`, `defaultParams`, `timeoutMs`, `maxRetries`.

Przykładowe typy (w `src/types.ts`):

```ts
export type Role = 'system' | 'user' | 'assistant' | 'tool';
export type OpenRouterMessage = { role: Role; content: string };

export type ResponseFormat =
  | undefined
  | {
      type: 'json_schema';
      json_schema: {
        name: string;
        strict: true;
        schema: Record<string, unknown>; // JSON Schema draft-07 kompatybilny
      };
    };

export type OpenRouterParams = {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  seed?: number;
};

export type ChatRequest = {
  system?: string;
  user: string | OpenRouterMessage[]; // pojedynczy prompt lub wcześniejsza historia
  model?: string;
  params?: OpenRouterParams;
  response_format?: ResponseFormat;
};

export type ChatResult = {
  content: string; // scalona treść z wyboru(ów)
  raw: unknown; // pełna odpowiedź OpenRouter (do debug/log)
};

export type ChatChunk = { delta: string; done: boolean };
```

## 4. Prywatne metody i pola

- **`request(path: string, init: RequestInit, retry = 0): Promise<Response>`**
  - Wysyła żądanie do OpenRouter z nagłówkami i timeoutem.
  - Implementuje retry z backoff dla 429/5xx i błędów sieciowych.

- **`getHeaders(): Record<string, string>`**
  - Ustawia `Authorization: Bearer <KEY>`, `HTTP-Referer`, `X-Title`, `Content-Type: application/json`.

- **`toAbortSignal(timeoutMs: number): AbortSignal`**
  - Tworzy `AbortController` dla timeoutu.

- **`handleError(resp: Response, body?: any): never`**
  - Rzuca skonstruowany błąd domenowy z kodem i kontekstem.

- **`redact(obj: unknown): unknown`**
  - Redaguje wrażliwe fragmenty z logów (np. klucze, e-maile, ID tokenów).

- **Pola prywatne**: `apiKey`, `cfg`.

## 5. Obsługa błędów

Potencjalne scenariusze i reakcje:

1. **401/403 – brak lub zły klucz API**
   - Sprawdź obecność `OPENROUTER_API_KEY`. Zwróć 500 z komunikatem serwerowym bez ujawniania szczegółów.
2. **400 – zła składnia żądania**
   - Waliduj wejście Zodem w endpointzie. Zwróć 400 z informacją dla klienta.
3. **404/409 – model niedostępny lub konflikt parametrów**
   - Fallback do `openrouter/auto` lub skonfigurowanego modelu zapasowego; log ostrzegawczy.
4. **408/ETIMEDOUT – timeout**
   - Zwiększ `timeoutMs` per-request lub zmniejsz `max_tokens`; jedna próba retry (idempotentne).
5. **429 – rate limit**
   - Exponential backoff (np. 500ms, 1500ms, 3500ms), respektuj `Retry-After`.
6. **5xx – błąd dostawcy**
   - Retry z backoff; ostatecznie 502 do klienta, bez danych wewnętrznych.
7. **Błąd sieciowy (DNS, TLS, reset)**
   - Jedno-dwa retry; loguj i eskaluj 503.
8. **Przekroczony limit tokenów**
   - Skracaj historię (pruning), użyj `max_tokens`; zwróć 400 z instrukcją skrócenia promptu.
9. **Walidacja JSON (response_format)**
   - Jeśli `strict: true` i schema nie przechodzi – wykonaj re-ask (opcjonalnie) lub zwróć 422.
10. **Błędy deserializacji streamu**
    - Bezpieczne domknięcie strumienia, częściowa treść jest ignorowana, 502/503.

## 6. Kwestie bezpieczeństwa

- **Sekrety tylko na serwerze**: `OPENROUTER_API_KEY` dostępny jedynie w kodzie SSR/API. Nigdy nie wypływa do klienta.
- **Walidacja wejścia**: u użyciu `zod` w `src/pages/api/ai/chat.ts` przed wywołaniem serwisu.
- **Redakcja logów**: nie logować pełnych promptów z danymi osobowymi; stosować `redact()`.
- **RLS i autoryzacja**: jeżeli wynik jest zapisywany w Supabase – używać RLS i JWT, zgodnie z `src/db` i regułami projektu.
- **CORS**: Endpoint wewnętrzny w tej samej domenie; jeśli otwierany publicznie – whitelist origin i metody.
- **Ochrona przed nadużyciami**: wprowadzić podstawowy throttling na endpointzie (np. IP-based) i/lub wymagać sesji użytkownika.

## 7. Plan wdrożenia krok po kroku

- **[1] Przygotowanie środowiska**
  - Dodać sekrety w CI/hosting:
    - `OPENROUTER_API_KEY`
    - `OPENROUTER_APP_URL` (np. produkcyjny URL)
    - `OPENROUTER_APP_NAME` (np. "Nature Log")
  - Lokalnie: `.env` (Astro) i konfiguracja w DigitalOcean/GitHub Actions.

- **[2] Typy i schematy** (`src/types.ts`)
  - Dodać typy: `OpenRouterMessage`, `ResponseFormat`, `OpenRouterParams`, `ChatRequest`, `ChatResult`.
  - Dodać Zod-schematy dla walidacji wejścia endpointu i ewentualnej walidacji odpowiedzi.

- **[3] Implementacja serwisu** (`src/lib/services/openrouter.service.ts`)
  - Klasa `OpenRouterService` z metodami:
    - `generateChat()` – non-stream
    - `streamChat()` – stream SSE/ReadableStream
    - pomocnicze: `buildMessages()`, `validateStructured()`, `request()`, `getHeaders()`, `toAbortSignal()`, `handleError()`, `redact()`
  - Domyślne `cfg`: `baseUrl: 'https://openrouter.ai/api/v1'`, `defaultModel: 'openrouter/auto'`, `timeoutMs: 60000`, `maxRetries: 2`.

- **[4] Endpoint API** (`src/pages/api/ai/chat.ts`)
  - Metoda `POST` (uppercase zgodnie z zasadami) z walidacją Zod.
  - Tworzy instancję `OpenRouterService` używając `import.meta.env` (tylko SSR).
  - Wywołuje `generateChat()` lub `streamChat()` zależnie od flagi.
  - Zwraca JSON: `{ content, raw? }` lub strumień.

- **[5] Integracja w UI**
  - React komponent (klient): wysyła `fetch('/api/ai/chat', { method: 'POST', body })`.
  - Dla streamingu: wykorzystać `ReadableStream`/EventSource i inkrementalnie wyświetlać tekst.

- **[6] Testy i obsługa błędów**
  - Testy jednostkowe metod serwisu (mock fetch), testy integracyjne endpointu.
  - Scenariusze błędów 1–10 z sekcji 5.

- **[7] Monitoring/Logowanie**
  - Logi po stronie serwera z redakcją danych.
  - Mierzyć czasy, retry i kody odpowiedzi.

- **[8] CI/CD**
  - GitHub Actions: lint → test → build → docker → deploy (zgodnie z projektem).
  - Sekrety ustawione w repo/DO.

## Implementacyjne szczegóły zgodne z OpenRouter API

### 7.1 Komunikat systemowy (przykład 1)

```ts
const messages: OpenRouterMessage[] = [
  { role: 'system', content: 'Jesteś asystentem Nature Log. Odpowiadasz zwięźle i w JSON, gdy wymagane.' },
  { role: 'user', content: 'Wypisz 3 gatunki ptaków wodnych w Polsce.' },
];
```

- Dodawany jako pierwszy w `messages` przez `buildMessages()` jeśli `ChatRequest.system` jest ustawiony.

### 7.2 Komunikat użytkownika (przykład 2)

```ts
const req: ChatRequest = {
  user: 'Opisz siedliska bobra europejskiego w 2 zdaniach.',
};
```

- Może być string lub tablica wiadomości (z historią). `buildMessages()` zunifikuje wejście.

### 7.3 Ustrukturyzowane odpowiedzi przez `response_format` (przykład 3)

Używamy wzorca:

```ts
const response_format: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'bird_list',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              common_name: { type: 'string' },
              latin_name: { type: 'string' },
            },
            required: ['common_name', 'latin_name'],
          },
          minItems: 1,
          maxItems: 10,
        },
      },
      required: ['items'],
    },
  },
};
```

Walidacja po stronie serwisu (opcjonalna, ale zalecana) przez `validateStructured()` z Zod/ajv.

### 7.4 Nazwa modelu (przykład 4)

```ts
const req: ChatRequest = {
  user: 'Stwórz krótkie streszczenie 2 zdania.',
  model: 'openai/gpt-4o-mini', // lub 'openrouter/auto' dla automatycznego doboru
};
```

- Jeśli `model` nie podany → użyj `cfg.defaultModel`.
- W przypadku błędu modelu → fallback i ostrzegawczy log.

### 7.5 Parametry modelu (przykład 5)

```ts
const req: ChatRequest = {
  user: 'Wypisz 5 drzew liściastych.',
  params: { temperature: 0.2, max_tokens: 400, top_p: 0.95, seed: 42 },
};
```

- Mergowane z `cfg.defaultParams` (req ma pierwszeństwo). Przekazywane w body do OpenRouter.

## Minimalna implementacja zapytania (non-stream)

```ts
async function generateChat(input: ChatRequest): Promise<ChatResult> {
  const url = `${this.cfg.baseUrl ?? 'https://openrouter.ai/api/v1'}/chat/completions`;
  const messages = buildMessages(input);
  const body = {
    model: input.model ?? this.cfg.defaultModel,
    messages,
    response_format: input.response_format,
    ...this.cfg.defaultParams,
    ...input.params,
  };

  const res = await this.request('/chat/completions', {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => undefined);
    this.handleError(res, errBody);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  return { content, raw: json };
}
```

Nagłówki wymagane przez OpenRouter:

```ts
getHeaders() {
  return {
    'Authorization': `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
    ...(this.cfg.appUrl ? { 'HTTP-Referer': this.cfg.appUrl } : {}),
    ...(this.cfg.appName ? { 'X-Title': this.cfg.appName } : {}),
  };
}
```

## Przykładowy endpoint Astro (`src/pages/api/ai/chat.ts`)

Zgodnie z zasadami: handler `POST`, walidacja Zod, brak eksportu default.

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { OpenRouterService } from '../../lib/services/openrouter.service';

const BodySchema = z.object({
  system: z.string().min(1).optional(),
  user: z.union([
    z.string().min(1),
    z.array(z.object({ role: z.enum(['system', 'user', 'assistant', 'tool']), content: z.string() })),
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
  response_format: z.any().optional(), // można doprecyzować JSON Schema
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json();
    const body = BodySchema.parse(raw);

    const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY, {
      defaultModel: 'openrouter/auto',
      appUrl: import.meta.env.OPENROUTER_APP_URL,
      appName: import.meta.env.OPENROUTER_APP_NAME,
      timeoutMs: 60_000,
      maxRetries: 2,
    });

    const result = await service.generateChat(body);
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const msg = err?.message ?? 'Internal Server Error';
    return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
  }
};

export const prerender = false;
```

## Notatki implementacyjne

- Przenoś całą logikę HTTP do `OpenRouterService` (endpoint prosty i testowalny).
- Waliduj wejścia/wyjścia Zodem, utrzymuj minimalny surface API w endpointzie.
- Dla streamingu: użyj `ReadableStream` i parsuj `data:` linie SSE. Zwróć strumień do klienta.
- Integracja UI: komponent React ładuje się przez `client:load`/`client:idle` tylko dla interakcji (zgodnie z zasadami projektu).

## Checklista jakości (zgodna z .windsurfrules)

- **Astro API**: `POST`, `export const prerender = false`, walidacja Zod, logika w `src/lib/services`.
- **TypeScript**: pełne typowanie DTO w `src/types.ts`.
- **Błędy**: wczesne zwroty, guard clauses, spójne komunikaty dla klienta.
- **Bezpieczeństwo**: klucz API wyłącznie w SSR, redakcja logów, ewentualny throttling.
- **CI/CD**: sekrety w GH Actions i środowisku DO; testy i lint przed deployem.
