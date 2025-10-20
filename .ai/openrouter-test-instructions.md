# Jak przetestować OpenRouter Service

## 🧪 Test integracyjny z prawdziwym API

Utworzyłam skrypt testowy który sprawdzi czy OpenRouter Service działa poprawnie z prawdziwym API.

---

## 📋 Krok po kroku

### 1. Zdobądź klucz API OpenRouter

1. Wejdź na: https://openrouter.ai
2. Zaloguj się (możesz użyć Google/GitHub)
3. Przejdź do: https://openrouter.ai/keys
4. Kliknij **"Create Key"**
5. Skopiuj klucz (zaczyna się od `sk-or-v1-`)

### 2. Dodaj klucz do `.env`

Otwórz plik `.env` w głównym katalogu projektu i dodaj:

```env
# OpenRouter API (dla testów)
OPENROUTER_API_KEY=sk-or-v1-twoj-klucz-tutaj
OPENROUTER_APP_NAME=Nature Log
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
```

### 3. Zainstaluj wymagane pakiety

```bash
# Jeśli nie masz tsx (TypeScript executor)
npm install -D tsx

# Jeśli nie masz dotenv
npm install dotenv
```

### 4. Uruchom test

```bash
# Test podstawowy (bez streamingu)
npx tsx scripts/test-openrouter.ts

# Test z streamingiem
npx tsx scripts/test-openrouter.ts --stream
```

---

## ✅ Co testuje skrypt?

### Test 1: Prosty czat ✉️
- Wysyła proste pytanie: "Wymień 2 gatunki ptaków wodnych w Polsce"
- Sprawdza czy odpowiedź przychodzi poprawnie
- Wyświetla użyty model

### Test 2: Strukturyzowana odpowiedź (JSON Schema) 📊
- Wysyła zapytanie z `response_format` (JSON Schema)
- Waliduje odpowiedź przez Zod
- Sprawdza czy struktura jest zgodna ze schematem

### Test 3: Różne modele 🔄
- Używa `withModel()` do zmiany modelu na `gpt-4o-mini`
- Sprawdza czy parametry są przekazywane poprawnie

### Test 4: Streaming (opcjonalny) 📡
- Testuje streaming odpowiedzi token po tokenie
- Wyświetla odpowiedź na bieżąco
- Liczy chunki

### Test 5: buildMessages (unit test) 🧩
- Testuje metodę `buildMessages()` bez API
- Sprawdza różne formaty wejściowe

---

## 💰 Koszty testów

**Praktycznie darmowe!** 🎉

- Test 1-3: ~500 tokenów input + ~100 tokenów output
- **Koszt**: ~$0.0001 (jedna dziesiąta centa)
- Model: `google/gemini-flash-1.5` (najtańszy)

Możesz uruchamiać testy wielokrotnie bez obaw o koszty.

---

## 📊 Przykładowy output

```
============================================================
OpenRouter Service - Testy Integracyjne
============================================================

📝 Test 5: buildMessages (unit test)
✅ Sukces!
messages1: [{"role":"system","content":"Jesteś asystentem."},{"role":"user","content":"Cześć!"}]
messages2: [{"role":"user","content":"Pytanie 1"},{"role":"assistant","content":"Odpowiedź 1"},{"role":"user","content":"Pytanie 2"}]

⚠️  Następne testy będą wykonywać prawdziwe wywołania API
   Koszt: ~$0.0001 (praktycznie darmowe)

📝 Test 1: Prosty czat
✅ Sukces!
Odpowiedź: Łabędź niemy i krzyżówka to dwa popularne gatunki ptaków wodnych w Polsce.
Model użyty: google/gemini-flash-1.5

📝 Test 2: Strukturyzowana odpowiedź (JSON Schema)
✅ Sukces!
Zwalidowane dane: {
  "birds": [
    {
      "polish_name": "Łabędź niemy",
      "latin_name": "Cygnus olor"
    },
    {
      "polish_name": "Krzyżówka",
      "latin_name": "Anas platyrhynchos"
    }
  ]
}

📝 Test 3: Użycie innego modelu (withModel)
✅ Sukces!
Odpowiedź: Niebieski
Model użyty: openai/gpt-4o-mini

⏭️  Test 4 (streaming) pominięty. Użyj --stream aby uruchomić.

============================================================
Podsumowanie testów:
============================================================
Test 1 (Prosty czat): ✅
Test 2 (JSON Schema): ✅
Test 3 (Różne modele): ✅
Test 4 (Streaming): ⏭️  pominięty
Test 5 (buildMessages): ✅

Wynik: 4/4 testów przeszło

🎉 Wszystkie testy przeszły pomyślnie!
OpenRouter Service działa poprawnie! 🚀
```

---

## 🐛 Troubleshooting

### Błąd: "OPENROUTER_API_KEY not configured"
- Sprawdź czy dodałaś klucz do `.env`
- Upewnij się że plik `.env` jest w głównym katalogu projektu
- Sprawdź czy nie ma literówki w nazwie zmiennej

### Błąd: "401 Unauthorized"
- Klucz API jest nieprawidłowy
- Wygeneruj nowy klucz na https://openrouter.ai/keys

### Błąd: "429 Rate Limit"
- Przekroczyłaś limit requestów (mało prawdopodobne w testach)
- Poczekaj chwilę i spróbuj ponownie

### Błąd: "Network request failed"
- Sprawdź połączenie z internetem
- Sprawdź czy firewall nie blokuje połączenia

### Błąd: "Cannot find module 'tsx'"
```bash
npm install -D tsx
```

### Błąd: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

---

## 🔄 Alternatywny sposób testowania

Jeśli nie chcesz używać skryptu, możesz przetestować przez stronę demo:

1. Dodaj klucz API do `.env`
2. Uruchom dev server: `npm run dev`
3. Otwórz: http://localhost:4321/ai-demo
4. Przetestuj oba komponenty (blokowy i streaming)

---

## 📝 Co dalej po testach?

Jeśli testy przeszły pomyślnie:

✅ **OpenRouter Service działa poprawnie!**

Możesz:
1. Zostawić implementację na przyszłość (nie używać w MVP)
2. Zintegrować w konkretnej funkcji aplikacji
3. Usunąć klucz API z `.env` jeśli nie planujesz używać teraz

---

## 💡 Wskazówki

- **Nie commituj** `.env` do git (jest w `.gitignore`)
- **Usuń klucz API** z `.env` jeśli nie używasz AI w MVP
- **Zachowaj skrypt** `scripts/test-openrouter.ts` - przyda się w przyszłości
- **Monitoruj koszty** na https://openrouter.ai/activity

---

## 📚 Dodatkowe zasoby

- **Quick Start**: `.ai/openrouter-quick-start.md`
- **Przykłady użycia**: `.ai/openrouter-usage-examples.md`
- **Plan implementacji**: `.ai/openrouter-service-implementation-plan.md`
- **Testy jednostkowe**: `src/lib/services/__tests__/openrouter.service.test.ts`

---

**Powodzenia z testami! 🚀**
