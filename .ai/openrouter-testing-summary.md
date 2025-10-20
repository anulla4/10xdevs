# OpenRouter Service - Podsumowanie testowania

## ✅ Co zostało przygotowane

### 1. Skrypt testowy
📄 **`scripts/test-openrouter.ts`** - kompletny test integracyjny

**5 testów:**
- ✅ Test 1: Prosty czat
- ✅ Test 2: JSON Schema z walidacją Zod
- ✅ Test 3: Różne modele (`withModel`)
- ✅ Test 4: Streaming (opcjonalny)
- ✅ Test 5: buildMessages (unit test)

### 2. Dokumentacja
- 📄 `.ai/openrouter-test-instructions.md` - szczegółowa instrukcja
- 📄 `.ai/openrouter-quick-start.md` - zaktualizowany o testy
- 📄 `scripts/README.md` - dokumentacja skryptu

---

## 🚀 Jak uruchomić test (krok po kroku)

### Krok 1: Zdobądź klucz API
1. Wejdź na: https://openrouter.ai
2. Zaloguj się (Google/GitHub)
3. Przejdź do: https://openrouter.ai/keys
4. Kliknij "Create Key"
5. Skopiuj klucz (zaczyna się od `sk-or-v1-`)

### Krok 2: Dodaj klucz do `.env`
```env
OPENROUTER_API_KEY=sk-or-v1-twoj-klucz-tutaj
OPENROUTER_APP_NAME=Nature Log
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
```

### Krok 3: Zainstaluj zależności
```bash
npm install -D tsx
npm install dotenv
```

### Krok 4: Uruchom test
```bash
# Test podstawowy
npx tsx scripts/test-openrouter.ts

# Test z streamingiem
npx tsx scripts/test-openrouter.ts --stream
```

---

## 💰 Koszty testów

**~$0.0001** (jedna dziesiąta centa) za pełny test

- Model: `google/gemini-flash-1.5` (najtańszy)
- ~500 tokenów input + ~100 tokenów output
- Możesz uruchamiać wielokrotnie bez obaw

---

## 📊 Oczekiwany wynik

Jeśli wszystko działa poprawnie, zobaczysz:

```
============================================================
OpenRouter Service - Testy Integracyjne
============================================================

📝 Test 5: buildMessages (unit test)
✅ Sukces!

📝 Test 1: Prosty czat
✅ Sukces!
Odpowiedź: Łabędź niemy i krzyżówka...

📝 Test 2: Strukturyzowana odpowiedź (JSON Schema)
✅ Sukces!
Zwalidowane dane: { "birds": [...] }

📝 Test 3: Użycie innego modelu (withModel)
✅ Sukces!

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

## 🎯 Co sprawdza test?

### Test 1: Prosty czat ✉️
- Podstawowe wywołanie API
- Sprawdza czy odpowiedź przychodzi
- Weryfikuje użyty model

### Test 2: JSON Schema 📊
- Wysyła zapytanie z `response_format`
- Waliduje odpowiedź przez Zod
- Sprawdza strukturę danych

### Test 3: Różne modele 🔄
- Używa `withModel()` do zmiany modelu
- Testuje `gpt-4o-mini`
- Sprawdza przekazywanie parametrów

### Test 4: Streaming 📡
- Testuje streaming token po tokenie
- Wyświetla odpowiedź na bieżąco
- Liczy chunki

### Test 5: buildMessages 🧩
- Unit test bez API
- Sprawdza różne formaty wejściowe
- Testuje system + user messages

---

## 🐛 Możliwe problemy

### "Cannot find module 'tsx'"
```bash
npm install -D tsx
```

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### "OPENROUTER_API_KEY not configured"
- Sprawdź czy dodałaś klucz do `.env`
- Upewnij się że plik `.env` jest w głównym katalogu

### "401 Unauthorized"
- Klucz API jest nieprawidłowy
- Wygeneruj nowy na https://openrouter.ai/keys

### "Network request failed"
- Sprawdź połączenie z internetem
- Sprawdź firewall

---

## 🔄 Alternatywne testowanie

Jeśli nie chcesz używać skryptu:

### Opcja A: Strona demo
```bash
npm run dev
```
Otwórz: http://localhost:4321/ai-demo

### Opcja B: Testy jednostkowe (bez API)
```bash
npm install -D vitest
npm test
```

---

## ✅ Po testach

Jeśli testy przeszły:
- ✅ **OpenRouter Service działa poprawnie!**
- ✅ Możesz używać w aplikacji
- ✅ Lub zostawić na przyszłość (nie używać w MVP)

Jeśli nie planujesz używać teraz:
- ❌ Usuń klucz API z `.env`
- ✅ Zachowaj implementację (gotowa na przyszłość)

---

## 📚 Pełna dokumentacja

1. **Quick Start**: `.ai/openrouter-quick-start.md`
2. **Instrukcje testów**: `.ai/openrouter-test-instructions.md`
3. **Przykłady użycia**: `.ai/openrouter-usage-examples.md`
4. **Plan implementacji**: `.ai/openrouter-service-implementation-plan.md`

---

## 🎯 Podsumowanie

✅ **Skrypt testowy gotowy**: `scripts/test-openrouter.ts`
✅ **Dokumentacja kompletna**: 4 pliki w `.ai/`
✅ **Koszty minimalne**: ~$0.0001 za test
✅ **5 testów**: prosty czat, JSON Schema, modele, streaming, unit test

**Wszystko gotowe do przetestowania! Wystarczy dodać klucz API i uruchomić.** 🚀

---

## 💡 Następne kroki

1. **Teraz**: Zdobądź klucz API i uruchom test
2. **Jeśli działa**: Zdecyduj czy używać w MVP czy zostawić na przyszłość
3. **Jeśli nie używasz**: Usuń klucz z `.env`, zachowaj kod
4. **W przyszłości**: Wszystko gotowe, wystarczy dodać klucz i zintegrować

**Powodzenia! 🎉**
