# Scripts - OpenRouter Test

## 📄 test-openrouter.ts

Skrypt testowy do weryfikacji integracji OpenRouter Service z prawdziwym API.

### Wymagania

- Node.js
- Klucz API OpenRouter (https://openrouter.ai/keys)
- Pakiety: `tsx`, `dotenv` (instalacja poniżej)

### Instalacja zależności

```bash
npm install -D tsx
npm install dotenv
```

### Konfiguracja

Dodaj do `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-twoj-klucz-tutaj
OPENROUTER_APP_NAME=Nature Log
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
```

### Uruchomienie

```bash
# Test podstawowy (bez streamingu)
npx tsx scripts/test-openrouter.ts

# Test z streamingiem
npx tsx scripts/test-openrouter.ts --stream
```

### Co testuje?

1. ✅ **Prosty czat** - podstawowe wywołanie API
2. ✅ **JSON Schema** - strukturyzowana odpowiedź z walidacją Zod
3. ✅ **Różne modele** - zmiana modelu przez `withModel()`
4. ✅ **Streaming** (opcjonalny) - odpowiedź token po tokenie
5. ✅ **buildMessages** - unit test bez API

### Koszty

**~$0.0001** (praktycznie darmowe) za pełny test

### Więcej informacji

Zobacz: `.ai/openrouter-test-instructions.md`
