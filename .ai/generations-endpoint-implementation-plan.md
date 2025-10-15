# API Endpoint Implementation Plan: GET /api/observations

## 1. Przegląd punktu końcowego
- **Cel**: Zwraca listę obserwacji zalogowanego użytkownika z paginacją, filtrowaniem, wyszukiwaniem tekstowym oraz sortowaniem.
- **Źródła danych**: Tabela `public.observations` z powiązaną kategorią z `public.categories` oraz referencją do `public.location_sources`.
- **Uwagi**:
  - RLS zapewnia dostęp tylko do własnych rekordów użytkownika (patrz `db-plan.md`).
  - `location` w DB to PostGIS `geometry(Point,4326)`. API eksponuje `{ lat, lng, accuracy, source }`.
  - Zwracane są nagłówki: `X-Total-Count`, `X-Page`, `X-Limit`.

## 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/observations`
- **Parametry zapytania**:
  - **Wymagane**: brak
  - **Opcjonalne**:
    - `page`: number, domyślnie 1 (min 1)
    - `limit`: number, domyślnie 20 (1..100)
    - `q`: string (wyszukiwanie w `name` + fallback w `description`)
    - `favorite`: `true|false`
    - `category_id`: `uuid`
    - `sort`: `observation_date|name|created_at` (domyślnie `observation_date`)
    - `order`: `asc|desc` (dla `observation_date` domyślnie `desc`, w pozostałych `asc`)

## 3. Wykorzystywane typy
- Z `src/types.ts`:
  - **`ObservationDto`**: odpowiedź pojedynczego elementu listy.
  - **`ListResponse<ObservationDto>`**: obiekt odpowiedzi listowej `{ items: ObservationDto[] }`.
- Pomocnicze:
  - **`CategoryRefDto`**, **`ObservationLocationDto`**, **`GeoPointDto`**.

## 3. Szczegóły odpowiedzi
- **Status 200** z nagłówkami `X-Total-Count`, `X-Page`, `X-Limit`.
- **Body**: `ListResponse<ObservationDto>`
```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "string",
      "name": "string",
      "description": "string|null",
      "observation_date": "ISO-8601",
      "is_favorite": true,
      "category": { "id":"uuid", "name":"string", "icon":"string", "color":"#RRGGBB" },
      "location": { "lat": number, "lng": number, "accuracy": number|null, "source":"manual|gps|null" },
      "created_at": "ISO-8601",
      "updated_at": "ISO-8601"
    }
  ]
}
```
- **Błędy**:
  - 400 dla niepoprawnych parametrów
  - 401 dla braku/nieprawidłowego JWT
  - 500 dla błędów serwera

## 4. Przepływ danych
1. **Wejście**: Zapytanie HTTP trafia do `src/pages/api/observations.ts` (Astro server route).
2. **Auth**: W middleware/route odczyt JWT, utworzenie Supabase clienta z kontekstu: `locals.supabase` (zgodnie z `.windsurfrules`).
3. **Walidacja**: Zod waliduje i normalizuje query params (page/limit domyślne; sort/order domyślne zależne od pola).
4. **Service**: Wywołanie serwisu `src/lib/services/observations.service.ts` z ustandaryzowanymi parametrami.
5. **Dostęp do DB**: Serwis wykonuje zapytanie do Supabase PostgREST:
   - Filtry: `user_id = auth.uid()` zapewnione przez RLS; dodatkowo `category_id`, `is_favorite`, wyszukiwanie `q`.
   - Sortowanie: po `observation_date|name|created_at` z odpowiednim `order`.
   - Paginacja: `range(from, to)`.
   - Dołączenie kategorii: `select('id, slug, name, description, observation_date, is_favorite, location_source, location_accuracy, created_at, updated_at, category:categories(id,name,icon,color)')`.
   - Pozyskanie współrzędnych: rekomendowane przezroczyste ujawnienie `lat/lng` przez **widok** lub **RPC**:
     - Preferowane: utworzyć widok `public.observations_read` z kolumnami `lat := ST_Y(location)`, `lng := ST_X(location)`, następnie `select` z tego widoku (RLS dziedziczony przez SECURITY INVOKER + polityki na bazowej tabeli).
     - Alternatywa: funkcja RPC (SQL) `observations_list(...)` zwracająca rekordy z `lat/lng` i filtrowaniem w DB.
6. **Mapowanie**: Serwis mapuje wynik do `ObservationDto` (w tym `location: { lat, lng, accuracy, source }`).
7. **Wyjście**: Route ustawia nagłówki paginacji i zwraca `200` + JSON.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagany nagłówek `Authorization: Bearer <JWT>`; odrzucić 401 jeśli brak/invalid.
- **Autoryzacja (RLS)**: Operacje odbywają się w kontekście użytkownika; DB polityki ograniczają do własnych rekordów (`db-plan.md`).
- **Walidacja**: Twarda walidacja Zod (typy, zakresy, dozwolone wartości); `limit <= 100`, `page >= 1`.
- **Ograniczenie danych**: Selektuj tylko potrzebne kolumny. Brak wrażliwych danych w logach (poza `user_id`, `request_id`).
- **CORS/HTTPS**: Zgodnie z polityką deploy (Astro, DO). Konfiguracja CORS ograniczona do znanych domen frontu.

## 6. Obsługa błędów
- **400**: nieprawidłowe parametry (np. `limit > 100`, zły `sort`, niepoprawne `favorite`). Zwrócić `{ error: { code: 'ValidationError', message, details } }`.
- **401**: brak/nieprawidłowy JWT.
- **500**: nieoczekiwany błąd Supabase/serwera (zachować ogólne komunikaty; szczegóły w logach).
- Rekomendacja: centralny logger (request id, method, path, user id, status, latency). Ewentualna tabela błędów poza MVP.

## 8. Etapy wdrożenia
1. **Schemat danych do odczytu**:
   - Utworzyć widok `public.observations_read`:
     ```sql
     CREATE VIEW public.observations_read AS
     SELECT
       o.id,
       o.user_id,
       o.slug,
       o.name,
       o.description,
       o.observation_date,
       o.is_favorite,
       o.location_accuracy,
       o.location_source,
       ST_Y(o.location) AS lat,
       ST_X(o.location) AS lng,
       o.category_id,
       o.created_at,
       o.updated_at
     FROM public.observations o;
     ```
   - Zezwolić na SELECT dla roli `authenticated` z dodatkowymi politykami RLS bazującymi na `o.user_id = auth.uid()` poprzez polityki na tabeli bazowej (widok korzysta z RLS tabeli).

2. **Service** `src/lib/services/observations.service.ts`:
   - Eksport: `listObservations(params, supabase): Promise<{ items: ObservationDto[]; total: number }>`.
   - Parametry: `{ page, limit, q?, favorite?, category_id?, sort?, order? }`.
   - Implementacja:
     - Walidacja parametrów (typy/domysły) w warstwie route; service zakłada poprawne wejście.
     - Budowa zapytania `from('observations_read')` z `select(...)` + `categories` join via `select('..., category:categories(id,name,icon,color)')` przy użyciu `eq('category_id', categories.id)` poprzez `select` z relacją (jeśli widok nie wspiera relacji, dołączyć drugi request i zmapować asocjacje in-memory po `category_id`).
     - Filtrowanie: `category_id`, `is_favorite`, `q` (ILIKE na `name` + fallback `description` lub dedykowane pole wyszukiwawcze/indeks trgm na `name`).
     - Sortowanie i paginacja: `order(sort, { ascending })`, `range(from, to)`.
     - `total`: użyć `select('*', { count: 'exact', head: true })` na tym samym filtrze.
     - Mapowanie do `ObservationDto` (w tym `location: { lat, lng, accuracy, source }`).

3. **Endpoint** `src/pages/api/observations.ts`:
   - `export const prerender = false`.
   - Pobierz `supabase` z `locals.supabase` (zgodnie z `.windsurfrules`).
   - Zod schema dla query params:
     ```ts
     const QuerySchema = z.object({
       page: z.coerce.number().int().min(1).default(1),
       limit: z.coerce.number().int().min(1).max(100).default(20),
       q: z.string().trim().min(1).optional(),
       favorite: z.enum(['true','false']).transform(v => v === 'true').optional(),
       category_id: z.string().uuid().optional(),
       sort: z.enum(['observation_date','name','created_at']).default('observation_date'),
       order: z.enum(['asc','desc']).optional()
     }).transform(v => ({
       ...v,
       order: v.order ?? (v.sort === 'observation_date' ? 'desc' : 'asc')
     }))
     ```
   - Parsowanie, wywołanie serwisu, ustawienie nagłówków paginacji, zwrot `200` z `ListResponse<ObservationDto>`.
 
4. **Monitoring i logowanie**:
   - Logować: `request_id`, `user_id`, `method`, `path`, `status`, `latency`.
   - Błędy walidacyjne jako 400, błędy Supabase jako 500 z anonimowym komunikatem.

5. **Dokumentacja**:
   - Uzupełnić README sekcji API o query params i nagłówki.

6. **Optymalizacje (opcjonalnie)**:
   - Zamiana offset/limit na keyset pagination dla dużych list.
   - Zastąpienie widoku funkcją RPC z pełną kontrolą planu zapytania i projekcji kolumn.
