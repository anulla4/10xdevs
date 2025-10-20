# OpenRouter Service - Przykłady użycia

## Konfiguracja zmiennych środowiskowych

Dodaj do pliku `.env`:

```env
# Wymagane
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx

# Opcjonalne (zalecane)
OPENROUTER_APP_URL=https://naturelog.example.com
OPENROUTER_APP_NAME=Nature Log
# Domyślny model - google/gemini-flash-1.5 (najtańszy, $0.075/1M tokenów input)
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
```

W produkcji ustaw te zmienne w:
- **GitHub Actions**: Secrets w repozytorium
- **DigitalOcean**: Environment Variables w App Platform/Droplet

## Przykład 1: Prosty czat (endpoint API)

Endpoint już utworzony w `src/pages/api/ai/chat.ts`.

### Wywołanie z klienta (React):

```tsx
import { useState } from 'react'
import type { ChatResult } from '../types'

export function SimpleChatExample() {
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (prompt: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'Jesteś asystentem Nature Log. Odpowiadasz zwięźle.',
          user: prompt,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message ?? 'Request failed')
      }

      const data: ChatResult = await res.json()
      setResponse(data.content)
    } catch (err) {
      console.error('Chat error:', err)
      setResponse('Wystąpił błąd podczas komunikacji z AI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={() => handleSubmit('Wypisz 3 gatunki ptaków wodnych w Polsce.')}>
        Zapytaj AI
      </button>
      {loading && <p>Ładowanie...</p>}
      {response && <p>{response}</p>}
    </div>
  )
}
```

## Przykład 2: Ustrukturyzowana odpowiedź (JSON Schema)

### Endpoint z walidacją:

```ts
// src/pages/api/ai/identify-species.ts
export const prerender = false

import type { APIRoute } from 'astro'
import { z } from 'zod'
import { OpenRouterService } from '../../lib/services/openrouter.service'
import { createSuccessResponse, createErrorResponse } from '../../lib/api-error'

const SpeciesSchema = z.object({
  items: z.array(
    z.object({
      common_name: z.string(),
      latin_name: z.string(),
      habitat: z.string(),
      conservation_status: z.enum(['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX']),
    })
  ),
})

export const POST: APIRoute = async ({ request }) => {
  try {
    const { description } = await request.json()

    const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY, {
      defaultModel: 'openai/gpt-4o-mini',
      appUrl: import.meta.env.OPENROUTER_APP_URL,
      appName: import.meta.env.OPENROUTER_APP_NAME,
      timeoutMs: 60_000,
      maxRetries: 2,
    })

    const result = await service.generateChat({
      system: 'Jesteś ekspertem od identyfikacji gatunków. Zwracaj wyniki w JSON.',
      user: `Zidentyfikuj gatunki na podstawie opisu: ${description}`,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'species_list',
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
                    habitat: { type: 'string' },
                    conservation_status: {
                      type: 'string',
                      enum: ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'],
                    },
                  },
                  required: ['common_name', 'latin_name', 'habitat', 'conservation_status'],
                },
              },
            },
            required: ['items'],
          },
        },
      },
    })

    // Validate structured response
    const validated = service.validateStructured(result.content, SpeciesSchema)

    return createSuccessResponse(validated)
  } catch (err) {
    return createErrorResponse(err as Error, true)
  }
}
```

## Przykład 3: Streaming odpowiedzi

### Endpoint ze streamingiem:

```ts
// src/pages/api/ai/chat-stream.ts
export const prerender = false

import type { APIRoute } from 'astro'
import { OpenRouterService } from '../../lib/services/openrouter.service'

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt } = await request.json()

    const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY, {
      defaultModel: 'openrouter/auto',
      appUrl: import.meta.env.OPENROUTER_APP_URL,
      appName: import.meta.env.OPENROUTER_APP_NAME,
    })

    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of service.streamChat({
            system: 'Jesteś asystentem Nature Log.',
            user: prompt,
          })) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(new TextEncoder().encode(data))

            if (chunk.done) {
              controller.close()
              break
            }
          }
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Stream failed' }), { status: 500 })
  }
}
```

### Klient React ze streamingiem:

```tsx
import { useState } from 'react'

export function StreamingChatExample() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStream = async (prompt: string) => {
    setLoading(true)
    setContent('')

    try {
      const res = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunk = JSON.parse(line.slice(6))
            if (chunk.delta) {
              setContent((prev) => prev + chunk.delta)
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={() => handleStream('Opisz siedliska bobra europejskiego.')}>
        Streamuj odpowiedź
      </button>
      {loading && <p>Generowanie...</p>}
      <pre>{content}</pre>
    </div>
  )
}
```

## Przykład 4: Użycie bezpośrednie w serwisie (SSR)

```ts
// src/lib/services/ai-suggestions.service.ts
import { OpenRouterService } from './openrouter.service'
import type { ObservationDto } from '../../types'

export async function generateObservationSuggestions(
  observation: ObservationDto,
  apiKey: string
): Promise<string[]> {
  const service = new OpenRouterService(apiKey, {
    defaultModel: 'openai/gpt-4o-mini',
    defaultParams: { temperature: 0.7, max_tokens: 200 },
    timeoutMs: 30_000,
    maxRetries: 1,
  })

  const result = await service.generateChat({
    system: 'Jesteś ekspertem od przyrody. Generuj krótkie sugestie obserwacji.',
    user: `Na podstawie obserwacji "${observation.name}" w kategorii "${observation.category.name}", zaproponuj 3 podobne rzeczy do zaobserwowania w okolicy.`,
    params: { temperature: 0.8 },
  })

  // Parse suggestions from response
  const suggestions = result.content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .slice(0, 3)

  return suggestions
}
```

## Przykład 5: Różne modele dla różnych zadań

```ts
// src/lib/services/ai-tasks.service.ts
import { OpenRouterService } from './openrouter.service'

export class AITasksService {
  private baseService: OpenRouterService

  constructor(apiKey: string) {
    this.baseService = new OpenRouterService(apiKey, {
      defaultModel: 'openrouter/auto',
      appUrl: import.meta.env.OPENROUTER_APP_URL,
      appName: import.meta.env.OPENROUTER_APP_NAME,
    })
  }

  // Szybkie zadanie - tani model
  async quickSummary(text: string): Promise<string> {
    const service = this.baseService.withModel('openai/gpt-4o-mini', {
      temperature: 0.3,
      max_tokens: 150,
    })

    const result = await service.generateChat({
      system: 'Twórz zwięzłe streszczenia w 2 zdaniach.',
      user: text,
    })

    return result.content
  }

  // Złożone zadanie - mocniejszy model
  async detailedAnalysis(text: string): Promise<string> {
    const service = this.baseService.withModel('openai/gpt-4o', {
      temperature: 0.5,
      max_tokens: 1000,
    })

    const result = await service.generateChat({
      system: 'Jesteś ekspertem od analizy danych przyrodniczych.',
      user: `Przeprowadź szczegółową analizę: ${text}`,
    })

    return result.content
  }

  // Kreatywne zadanie - wyższa temperatura
  async creativeDescription(observation: string): Promise<string> {
    const service = this.baseService.withModel('anthropic/claude-3.5-sonnet', {
      temperature: 0.9,
      max_tokens: 500,
    })

    const result = await service.generateChat({
      system: 'Twórz poetyckie opisy przyrody.',
      user: `Opisz obserwację: ${observation}`,
    })

    return result.content
  }
}
```

## Obsługa błędów

```tsx
import type { ChatResult } from '../types'

async function safeChatRequest(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: prompt }),
    })

    if (!res.ok) {
      const error = await res.json()
      
      // Handle specific error codes
      switch (error.error?.code) {
        case 'ValidationError':
          return 'Nieprawidłowe dane wejściowe.'
        case 'Timeout':
          return 'Żądanie przekroczyło limit czasu. Spróbuj ponownie.'
        case 'RateLimitExceeded':
          return 'Zbyt wiele żądań. Poczekaj chwilę.'
        case 'AuthenticationError':
          return 'Błąd konfiguracji usługi AI.'
        default:
          return 'Wystąpił błąd. Spróbuj ponownie później.'
      }
    }

    const data: ChatResult = await res.json()
    return data.content
  } catch (err) {
    console.error('Chat request failed:', err)
    return 'Nie można połączyć się z usługą AI.'
  }
}
```

## Testowanie lokalne

1. Ustaw zmienne środowiskowe w `.env`
2. Uruchom dev server: `npm run dev`
3. Testuj endpoint:

```bash
curl -X POST http://localhost:4321/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "system": "Jesteś asystentem Nature Log.",
    "user": "Wypisz 3 gatunki drzew liściastych w Polsce."
  }'
```

## Monitoring kosztów

OpenRouter udostępnia dashboard do monitorowania:
- Liczby żądań
- Zużycia tokenów
- Kosztów per model
- Rate limitów

Dostęp: https://openrouter.ai/activity

## Porównanie modeli (ceny 2024/2025)

| Model | Input ($/1M) | Output ($/1M) | Context | Zalecenie |
|-------|--------------|---------------|---------|-----------|
| **google/gemini-flash-1.5** | $0.075 | $0.30 | 1M | ⭐ Najtańszy, świetny do prostych zadań |
| **openai/gpt-4o-mini** | $0.15 | $0.60 | 128k | Stabilny, dobra jakość |
| **anthropic/claude-3-haiku** | $0.25 | $1.25 | 200k | Szybki, świetna jakość |
| **openrouter/auto** | Dynamiczna | Dynamiczna | Zależny | Auto-wybór najtańszego |
| **openai/gpt-4o** | $2.50 | $10.00 | 128k | Premium, złożone zadania |

### Kiedy używać którego modelu?

- **Gemini Flash 1.5**: Identyfikacja gatunków, proste opisy, sugestie (domyślny)
- **GPT-4o-mini**: Gdy potrzebujesz stabilności i przewidywalności
- **Claude Haiku**: Analiza tekstu, bardziej złożone zadania
- **GPT-4o**: Tylko dla bardzo złożonych zadań wymagających najwyższej jakości

## Best Practices

1. **Używaj `google/gemini-flash-1.5`** jako domyślny (najlepszy stosunek cena/jakość)
2. **Ustawiaj `max_tokens`** aby kontrolować koszty
3. **Cachuj odpowiedzi** dla powtarzalnych zapytań
4. **Używaj streaming** dla długich odpowiedzi (lepsza UX)
5. **Waliduj odpowiedzi** przez Zod dla structured outputs
6. **Loguj model w details** do monitorowania kosztów
7. **Testuj z różnymi modelami** aby znaleźć optymalny stosunek jakość/koszt
