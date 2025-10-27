# OpenRouter - Jak użyć w przyszłości

## 🎯 Status: Gotowe, ale nieaktywne w MVP

Implementacja OpenRouter jest **kompletna i przetestowana**, ale **nie jest używana w MVP**.
Możesz ją włączyć w dowolnym momencie gdy będziesz potrzebować AI w aplikacji.

---

## ⚡ Szybki start (3 kroki)

### 1. Dodaj klucz API

Utwórz konto na https://openrouter.ai i pobierz klucz API.

Dodaj do pliku `.env`:

```env
# Wymagane
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx

# Opcjonalne (zalecane)
OPENROUTER_APP_URL=https://twoja-domena.com
OPENROUTER_APP_NAME=Nature Log
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
```

### 2. Przetestuj działanie

**Opcja A: Test skryptem (zalecane)**

```bash
# Zainstaluj wymagane pakiety
npm install -D tsx
npm install dotenv

# Uruchom test integracyjny
npx tsx scripts/test-openrouter.ts

# Lub z streamingiem
npx tsx scripts/test-openrouter.ts --stream
```

Test sprawdzi:

- ✅ Prosty czat
- ✅ JSON Schema z walidacją
- ✅ Różne modele
- ✅ Streaming (opcjonalnie)
- ✅ buildMessages

**Koszt**: ~$0.0001 (praktycznie darmowe)

**Opcja B: Test przez demo**

```bash
npm run dev
```

Otwórz: http://localhost:4321/ai-demo

Przetestuj oba tryby:

- **Czat blokowy** - odpowiedź po zakończeniu generowania
- **Czat streaming** - odpowiedź token po tokenie

### 3. Zintegruj w aplikacji

Użyj gotowych komponentów React lub wywołaj API bezpośrednio.

---

## 📁 Co zostało zaimplementowane?

### Serwis i typy

- ✅ `src/lib/services/openrouter.service.ts` - główny serwis (410 linii)
- ✅ `src/lib/services/__tests__/openrouter.service.test.ts` - 23 testy jednostkowe
- ✅ `src/types.ts` - typy TypeScript (Role, ChatRequest, ChatResult, etc.)

### Endpointy API

- ✅ `src/pages/api/ai/chat.ts` - POST endpoint dla czatu blokowego
- ✅ `src/pages/api/ai/chat-stream.ts` - POST endpoint dla streamingu

### Komponenty React

- ✅ `src/components/ai/AIChatBox.tsx` - komponent czatu blokowego
- ✅ `src/components/ai/AIStreamChat.tsx` - komponent czatu ze streamingiem

### Demo i dokumentacja

- ✅ `src/pages/ai-demo.astro` - strona demonstracyjna
- ✅ `.ai/openrouter-service-implementation-plan.md` - pełny plan implementacji
- ✅ `.ai/openrouter-usage-examples.md` - 7 przykładów użycia
- ✅ `.ai/openrouter-tests-template.md` - template testów Vitest

---

## 💡 Przykłady użycia

### Przykład 1: Prosty czat w komponencie React

```tsx
import { AIChatBox } from '../components/ai/AIChatBox';

export function MyComponent() {
  return (
    <AIChatBox
      client:load
      systemPrompt="Jesteś ekspertem od przyrody."
      placeholder="Zadaj pytanie o przyrodę..."
      onResponse={(response) => console.log(response)}
    />
  );
}
```

### Przykład 2: Wywołanie API bezpośrednio

```tsx
async function askAI(question: string) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: 'Jesteś asystentem Nature Log.',
      user: question,
    }),
  });

  const data = await response.json();
  return data.content;
}
```

### Przykład 3: Użycie serwisu w endpointcie Astro

```ts
// src/pages/api/my-ai-feature.ts
import { OpenRouterService } from '../../lib/services/openrouter.service';

export const POST: APIRoute = async ({ request }) => {
  const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY, {
    defaultModel: 'google/gemini-flash-1.5',
    timeoutMs: 30_000,
  });

  const result = await service.generateChat({
    system: 'Jesteś ekspertem.',
    user: 'Twoje pytanie',
  });

  return new Response(JSON.stringify(result));
};
```

### Przykład 4: Strukturyzowana odpowiedź (JSON Schema)

```ts
const result = await service.generateChat({
  system: 'Zwracaj wyniki w JSON.',
  user: 'Zidentyfikuj 3 gatunki ptaków',
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'bird_list',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                common_name: { type: 'string' },
                latin_name: { type: 'string' },
              },
              required: ['common_name', 'latin_name'],
            },
          },
        },
        required: ['items'],
      },
    },
  },
});

// Walidacja z Zod
const BirdSchema = z.object({
  items: z.array(
    z.object({
      common_name: z.string(),
      latin_name: z.string(),
    })
  ),
});

const validated = service.validateStructured(result.content, BirdSchema);
```

---

## 💰 Koszty

### Model domyślny: `google/gemini-flash-1.5`

- **Input**: $0.075 za 1M tokenów
- **Output**: $0.30 za 1M tokenów
- **Najtańszy** dostępny model z dobrą jakością

### Przykładowe koszty:

- **1000 requestów/miesiąc** (średnio 500 tokenów input + 200 output): **~$0.10/miesiąc**
- **10,000 requestów/miesiąc**: **~$1.00/miesiąc**

### Porównanie z innymi modelami:

| Model                       | Input ($/1M) | Output ($/1M) | Zalecenie                  |
| --------------------------- | ------------ | ------------- | -------------------------- |
| **google/gemini-flash-1.5** | $0.075       | $0.30         | ⭐ Domyślny (najtańszy)    |
| openai/gpt-4o-mini          | $0.15        | $0.60         | Stabilny, 2x droższy       |
| anthropic/claude-3-haiku    | $0.25        | $1.25         | Świetna jakość, 3x droższy |
| openai/gpt-4o               | $2.50        | $10.00        | Premium, 33x droższy       |

### Monitoring kosztów:

Dashboard OpenRouter: https://openrouter.ai/activity

- Liczba żądań
- Zużycie tokenów per model
- Koszty w czasie rzeczywistym
- Limity i alerty

---

## 🎨 Kiedy użyć AI w Nature Log?

### Funkcje które mogą wykorzystać AI (post-MVP):

#### 1. **Identyfikacja gatunków** 🔍

```tsx
// Przykład: Rozpoznawanie ptaków z opisu
const species = await askAI('Zidentyfikuj ptaka: mały, żółty brzuch, czarna czapeczka, śpiewa w lesie');
```

#### 2. **Automatyczne opisy** 📝

```tsx
// Przykład: Generowanie opisu obserwacji
const description = await askAI(`Wygeneruj krótki opis obserwacji: ${observation.name} w lokalizacji ${location}`);
```

#### 3. **Sugestie obserwacji** 💡

```tsx
// Przykład: Co można zobaczyć w okolicy
const suggestions = await askAI(`Jakie gatunki można zaobserwować w ${location} w ${season}?`);
```

#### 4. **Chatbot pomocniczy** 💬

```tsx
// Przykład: Pomoc dla użytkowników
<AIChatBox
  systemPrompt="Jesteś asystentem Nature Log. Pomagasz użytkownikom w obserwacji przyrody."
  placeholder="Zadaj pytanie o obserwacje przyrody..."
/>
```

#### 5. **Analiza danych** 📊

```tsx
// Przykład: Podsumowanie obserwacji użytkownika
const summary = await askAI(`Przeanalizuj moje obserwacje i podaj statystyki: ${JSON.stringify(observations)}`);
```

---

## 🔒 Bezpieczeństwo

### ✅ Zaimplementowane zabezpieczenia:

1. **Klucz API tylko na serwerze**
   - Nigdy nie wysyłany do klienta
   - Dostępny tylko w `import.meta.env` (SSR)

2. **Walidacja wejścia**
   - Zod schemas w endpointach
   - Sprawdzanie typów i zakresów

3. **Redakcja logów**
   - Wrażliwe dane nie są logowane
   - Metoda `redact()` w serwisie

4. **Obsługa błędów**
   - 10 scenariuszy błędów obsłużonych
   - Retry z exponential backoff
   - Timeout protection

5. **Rate limiting** (opcjonalnie do dodania)
   - Można dodać throttling per IP
   - Można wymagać sesji użytkownika

---

## 🧪 Testowanie

### Uruchomienie testów jednostkowych:

```bash
# Instalacja Vitest (jeśli nie zainstalowane)
npm install -D vitest @vitest/ui

# Uruchomienie testów
npm test

# Testy z UI
npm run test:ui

# Testy z coverage
npm run test:coverage
```

### Testy obejmują:

- ✅ Constructor validation
- ✅ buildMessages() - różne scenariusze
- ✅ generateChat() - success, params, retry
- ✅ validateStructured() - Zod validation
- ✅ withModel() - immutability
- ✅ Error handling - wszystkie kody HTTP

**23 testy jednostkowe** w `src/lib/services/__tests__/openrouter.service.test.ts`

---

## 🚀 Deployment

### Zmienne środowiskowe w produkcji:

#### GitHub Actions (Secrets):

```yaml
# .github/workflows/deploy.yml
env:
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  OPENROUTER_APP_URL: ${{ secrets.OPENROUTER_APP_URL }}
  OPENROUTER_APP_NAME: 'Nature Log'
```

#### DigitalOcean (Environment Variables):

```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_APP_URL=https://naturelog.example.com
OPENROUTER_APP_NAME=Nature Log
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
```

---

## 📚 Pełna dokumentacja

Szczegółowe informacje znajdziesz w:

1. **`.ai/openrouter-service-implementation-plan.md`**
   - Pełny plan implementacji
   - Architektura serwisu
   - Obsługa błędów
   - Kwestie bezpieczeństwa

2. **`.ai/openrouter-usage-examples.md`**
   - 7 praktycznych przykładów
   - Różne scenariusze użycia
   - Best practices
   - Porównanie modeli

3. **`.ai/openrouter-tests-template.md`**
   - Template testów Vitest
   - Mockowanie fetch
   - Testy integracyjne

---

## ❓ FAQ

### Czy muszę używać AI w MVP?

**NIE.** AI jest opcjonalne i oznaczone jako "poza MVP" w tech stacku.

### Czy implementacja kosztuje coś gdy nie używam?

**NIE.** Koszty są tylko za rzeczywiste wywołania API. Bez klucza API nic nie działa.

### Czy mogę usunąć stronę demo?

**TAK.** Usuń `src/pages/ai-demo.astro` jeśli nie potrzebujesz. Reszta zostanie.

### Jak zmienić model na inny?

Zmień w `.env`:

```env
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
```

Lub per-request w kodzie:

```ts
await service.generateChat({ user: '...', model: 'openai/gpt-4o-mini' });
```

### Czy mogę używać bez streamu?

**TAK.** Użyj tylko `/api/ai/chat` (blokowy) i komponentu `AIChatBox`.

### Jak ograniczyć koszty?

1. Ustaw `max_tokens` w parametrach
2. Używaj cache dla powtarzalnych zapytań
3. Monitoruj dashboard OpenRouter
4. Ustaw limity kosztów w OpenRouter

---

## 🎯 Podsumowanie

✅ **Implementacja jest kompletna i gotowa do użycia**
✅ **Nie wymaga żadnych zmian w MVP**
✅ **Możesz włączyć w dowolnym momencie (3 kroki)**
✅ **Koszty tylko za rzeczywiste użycie**
✅ **Pełna dokumentacja i testy**

**Gdy będziesz gotowa dodać AI - wszystko jest przygotowane!** 🚀
