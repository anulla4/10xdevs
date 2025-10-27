Przewodnik Migracji do Zdalnej Bazy Testowej

## ⚠️ UWAGA: Ten dokument opisuje migrację do zdalnej bazy testowej
## Lokalna baza działa na porcie 54321 (projekt: 10xDevs_Project)

## ✅ Wykonane kroki

### 1. Połączenie ze zdalną bazą testową
```powershell
npx supabase link --project-ref hdkvlfgrjzdpkgbbpzoy
```

### 2. Włączenie rozszerzenia PostGIS
Rozszerzenie zostało włączone przez Supabase Dashboard:
- Database → Extensions → postgis → Enable

### 3. Zastosowanie migracji
```powershell
npx supabase db push
```

Zastosowane migracje:
- ✅ `20251014195000_initial_schema.sql` - schemat bazy danych
- ✅ `20251015000000_disable_rls_dev.sql` - wyłączenie RLS dla developmentu
- ✅ `20251015120000_create_observations_read_view.sql` - widok do odczytu obserwacji

### 4. Załadowanie danych testowych
```powershell
npx supabase db push --include-seed
```

Załadowane dane:
- 3 kategorie (Roślina, Zwierzę, Skała)
- 1 użytkownik testowy (test@example.com / password123)
- 5 przykładowych obserwacji

## 📁 Konfiguracja plików środowiskowych

### `.env` - Lokalna baza danych
Używana podczas lokalnego developmentu z `npx supabase start`:
```env
SUPABASE_URL=http://127.0.0.1:54325
SUPABASE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### `.env.test` - Zdalna baza testowa
Używana podczas testów na zdalnej bazie:
```env
SUPABASE_URL=https://hdkvlfgrjzdpkgbbpzoy.supabase.co
SUPABASE_KEY=<twój_anon_key>
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Aby uzupełnić `.env.test`:**
1. Otwórz https://app.supabase.com/project/hdkvlfgrjzdpkgbbpzoy
2. Przejdź do **Settings** → **API**
3. Skopiuj:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`

## 🗄️ Struktura zdalnej bazy testowej

### Tabele:
- `public.profiles` - profile użytkowników
- `public.categories` - kategorie obserwacji
- `public.location_sources` - źródła lokalizacji (GPS, manual)
- `public.observations` - obserwacje przyrody
- `internal.app_settings` - ustawienia aplikacji

### Widoki:
- `public.observations_read` - widok do odczytu obserwacji z lat/lng

### Dane testowe:

**Użytkownik:**
- Email: `test@example.com`
- Hasło: `password123`
- ID: `00000000-0000-0000-0000-000000000001`

**Kategorie:**
| Nazwa    | Kolor     | Ikona    |
|----------|-----------|----------|
| Roślina  | #4ade80   | leaf     |
| Zwierzę  | #fb923c   | paw      |
| Skała    | #a8a29e   | mountain |

**Obserwacje:**
1. Dąb szypułkowy (Roślina, ulubiona)
2. Sosna zwyczajna (Roślina)
3. Lis rudy (Zwierzę, ulubiona)
4. Dzięcioł duży (Zwierzę)
5. Bazalt (Skała)

## 🔧 Przydatne komendy

### Sprawdzenie statusu migracji
```powershell
npx supabase migration list
```

### Zastosowanie nowych migracji do zdalnej bazy
```powershell
npx supabase db push
```

### Zastosowanie migracji wraz z danymi seed
```powershell
npx supabase db push --include-seed
```

### Pobranie schematu ze zdalnej bazy
```powershell
npx supabase db pull
```

### Dostęp do zdalnej bazy przez Supabase Studio
https://app.supabase.com/project/hdkvlfgrjzdpkgbbpzoy

## 🔄 Workflow: Lokalna vs Zdalna baza

### Development lokalny:
```powershell
# Użyj .env (lokalna baza)
npx supabase start
npm run dev
```

### Testy na zdalnej bazie:
```powershell
# Użyj .env.test (zdalna baza testowa)
# Upewnij się, że aplikacja używa .env.test
npm run test:e2e
```

## 📝 Dodawanie nowych migracji

1. **Stwórz nową migrację:**
   ```powershell
   npx supabase migration new nazwa_migracji
   ```

2. **Edytuj plik migracji** w `supabase/migrations/`

3. **Przetestuj lokalnie:**
   ```powershell
   npx supabase db reset
   ```

4. **Zastosuj na zdalnej bazie testowej:**
   ```powershell
   npx supabase db push
   ```

## ⚠️ Ważne uwagi

### RLS (Row Level Security)
- **Lokalna baza:** RLS wyłączony (dla wygody developmentu)
- **Zdalna baza testowa:** RLS wyłączony (migracja `20251015000000_disable_rls_dev.sql`)
- **Produkcja:** NIE stosuj migracji wyłączającej RLS!

### PostGIS
Rozszerzenie PostGIS jest wymagane do obsługi danych geograficznych. Upewnij się, że jest włączone w każdej nowej bazie.

### Dane testowe
Plik `seed.sql` zawiera dane testowe. Możesz go modyfikować według potrzeb, ale pamiętaj:
- Użytkownik testowy musi istnieć w `auth.users` przed dodaniem do `profiles`
- Kategorie muszą istnieć przed dodaniem obserwacji

## 🔐 Bezpieczeństwo

- ✅ Pliki `.env` i `.env.test` są w `.gitignore`
- ✅ Nie commituj kluczy API do repozytorium
- ✅ Użyj `anon` key w aplikacji klienckiej
- ✅ Użyj `service_role` key tylko w bezpiecznym środowisku backendowym

## 🚀 Następne kroki

1. **Uzupełnij `.env.test`** danymi ze zdalnej bazy
2. **Przetestuj połączenie** z aplikacją
3. **Uruchom testy E2E** na zdalnej bazie testowej
4. **Dokumentuj zmiany** w migracjach

## 📞 Rozwiązywanie problemów

### Problem: "type geometry does not exist"
**Przyczyna:** Brak rozszerzenia PostGIS  
**Rozwiązanie:** Włącz PostGIS w Database → Extensions

### Problem: Migracje nie są widoczne
**Przyczyna:** Migracje w złym katalogu  
**Rozwiązanie:** Upewnij się, że są w `10xdevs/supabase/migrations/`

### Problem: Błąd połączenia ze zdalną bazą
**Przyczyna:** Projekt nie jest połączony  
**Rozwiązanie:** `npx supabase link --project-ref hdkvlfgrjzdpkgbbpzoy`

### Problem: Dane seed nie ładują się
**Przyczyna:** Brak flagi `--include-seed`  
**Rozwiązanie:** `npx supabase db push --include-seed`
