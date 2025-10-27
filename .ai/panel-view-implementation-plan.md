# Plan implementacji widoku Panel (Lista + Mapa)

## 1. Przegląd

Widok Panel jest głównym ekranem aplikacji po zalogowaniu. Umożliwia jednoczesne przeglądanie listy obserwacji z paginacją, sortowaniem i filtrem tekstowym oraz wizualizację tych obserwacji na mapie (Leaflet) jako pinezki. Na desktopie posiada layout dwukolumnowy (Lista | Mapa), a na mobile przełącza się między zakładkami Lista/Mapa. Widok integruje się z endpointami `/api/observations` oraz `/api/observations/map`, współdzieli stan `selectedObservationId` oraz odświeża dane po operacjach CRUD wykonanych w formularzu dodawania/edycji.

## 2. Routing widoku

- Ścieżka: `/panel`
- Ochrona trasy: wymaga sesji (Supabase Auth). Przy braku sesji → redirect do `/auth/login`.
- Parametry URL (query): `page`, `limit`, `q`, `sort`, `order`, opcjonalnie `category_id`, `favorite`. Parametry odzwierciedlają stan filtrów listy.

## 3. Struktura komponentów

- `PanelPage`
  - `PanelToolbar` (filtry, sortowanie, wyszukiwanie, licznik wyników)
  - `PanelContent` (layout responsywny)
    - `ObservationList` (lista z paginacją)
      - `ObservationListItem` (pojedynczy wiersz)
    - `ObservationMap` (Leaflet, markery, bbox debounce)
  - `ObservationFormModal` (create/edit; otwierany z mapy/listy)
  - `ConfirmDeleteModal` (usuwanie)
  - `Toasts` (sukces/błąd)

## 4. Szczegóły komponentów

### PanelPage

- Opis: Główny kontener widoku. Inicjalizuje query klienta, czyta/wpisuje parametry URL, utrzymuje `selectedObservationId` i kontroluje layout (desktop/mobile).
- Główne elementy: wrapper, `PanelToolbar`, `PanelContent`, modale.
- Interakcje: synchronizacja URL↔stan, otwieranie/zamykanie modali, ustawianie `selectedObservationId`.
- Walidacja: brak (delegowana do podrzędnych komponentów i formularzy).
- Typy: `PanelQueryParams`, `SelectedObservationId`.
- Propsy: brak (strona).

### PanelToolbar

- Opis: Pasek filtrów i sortowania dla listy.
- Główne elementy: input tekstowy `q`, select `sort`, select `order`, (opcjonalnie) select `category`, toggle `favorite`.
- Interakcje: zmiana filtrów (debounce 300 ms dla `q`), aktualizacja URL, trigger refetch listy i mapy.
- Walidacja: poprawność wartości `order` (`asc|desc`), `sort` (white-list), `q` (max długość np. 200 znaków).
- Typy: `ObservationListFilters` (DTO query), `SortField` | `SortOrder`.
- Propsy: `value: ObservationListFilters`, `onChange(next: ObservationListFilters)`.

### PanelContent

- Opis: Layout responsywny. Renderuje dwie kolumny na desktopie, zakładki na mobile.
- Główne elementy: kontenery listy i mapy, przełącznik zakładek na mobile.
- Interakcje: przełączanie widoków; przekazuje `selectedObservationId` do dzieci.
- Walidacja: brak.
- Typy: `ViewportMode` (`desktop|mobile`).
- Propsy: `selectedObservationId`, handlery zdarzeń.

### ObservationList

- Opis: Lista obserwacji z paginacją, kliknięcie wiersza synchronizuje się z mapą.
- Główne elementy: tabela/lista, paginacja, stany loading/empty/error.
- Interakcje: klik wiersza → `onSelect(id)`, zmiana strony → update `page` w URL, hover/active stan na zaznaczonym.
- Walidacja: wartości `page` i `limit` w zakresie; sort i kolejność zgodne z API.
- Typy: `ObservationListItemVM[]`, `PaginationMeta`.
- Propsy: `filters: ObservationListFilters`, `selectedObservationId`, `onSelect(id)`, `onPageChange(page)`.

### ObservationListItem

- Opis: Wiersz listy (nazwa, data, miejscowość/skrót lokalizacji, ulubione, akcje).
- Główne elementy: przyciski Edytuj/Usuń (opcjonalnie), wskaźnik zaznaczenia.
- Interakcje: klik zaznacza i przewija/centruje mapę; przycisk Usuń otwiera `ConfirmDeleteModal`.
- Walidacja: brak.
- Typy: `ObservationListItemVM`.
- Propsy: `item`, `selected`, `onClick()`, `onEdit()`, `onDelete()`.

### ObservationMap

- Opis: Mapa Leaflet z markerami użytkownika; żąda markery z `/api/observations/map` z bbox (debounce 300 ms).
- Główne elementy: komponent mapy, warstwa markerów, tooltip z nazwą/datą i linkiem do szczegółów.
- Interakcje: ruch/zoom → aktualizacja bbox → refetch; klik markera ustawia `selectedObservationId`; klik w tło mapy może otwierać formularz dodania (prefill `{lat,lng}`).
- Walidacja: poprawność bbox (`min<max`, zakresy współrzędnych).
- Typy: `MapBbox`, `MarkerVM`.
- Propsy: `selectedObservationId`, `filters (category_id, favorite)`, `onMarkerSelect(id)`, `onMapClick(coord)`.

### ObservationFormModal

- Opis: Formularz dodawania/edycji obserwacji w modalu (lub bocznym panelu). Waliduje wg `api-plan.md` i wysyła `POST/PATCH`.
- Główne elementy: pola `name`, `description (≤500)`, `category_id` (select), `observation_date` (date/datetime), `location {lat,lng}`, `location_source`, `is_favorite`, akcje Zapisz/Anuluj.
- Interakcje: submit → optimistic update listy/mapy i invalidacja zapytań; zamknięcie po sukcesie; focus trap.
- Walidacja:
  - `name` 1..100,
  - `description` ≤500,
  - `category_id` wymagane,
  - `observation_date` ISO,
  - `location.lat` [-90..90], `location.lng` [-180..180],
  - `location_source` ∈ {manual|gps|null}.
- Typy: `ObservationWriteDTO`, `ObservationVM` (dla edycji), `CategoryDTO` (do selecta).
- Propsy: `mode: 'create'|'edit'`, `initial?: ObservationVM`, `prefillLocation?`, `onSuccess(createdOrUpdated)`, `onClose()`.

### ConfirmDeleteModal

- Opis: Modal potwierdzenia usunięcia obserwacji.
- Główne elementy: treść, przyciski Potwierdź/Anuluj.
- Interakcje: potwierdzenie → `DELETE /api/observations/:id` → optimistic removal + invalidacja listy/mapy.
- Walidacja: brak.
- Typy: `ObservationId`.
- Propsy: `observationId`, `onConfirm()`, `onCancel()`.

## 5. Typy

- DTO (zgodne z API):
  - `ObservationReadDTO` (jak w `api-plan.md`): `{ id, slug, name, description|null, observation_date, is_favorite, category: { id, name, icon, color }, location: { lat, lng, accuracy|null, source|null }, created_at, updated_at }`.
  - `ObservationWriteDTO`: `{ name, description|null, category_id, observation_date, location: {lat,lng}, location_source|null, location_accuracy|null, is_favorite }`.
  - `CategoryDTO`: `{ id, name, icon, color, sort_order }`.
  - `MarkersDTO`: `{ markers: Array<{ id, lat, lng, name, observation_date }> }`.
- ViewModel (UI):
  - `ObservationListItemVM`: `{ id, name, dateLabel, locationLabel, isFavorite, categoryBadge: { name, color, icon } }`.
  - `MarkerVM`: `{ id, lat, lng, title, subtitle }`.
  - `PaginationMeta`: `{ total: number, page: number, limit: number }`.
  - `ObservationVM` (do formularza edycji): `{ id, name, description|null, observation_date, category_id, is_favorite, location: {lat,lng}, location_source|null, location_accuracy|null }`.
  - `ObservationListFilters`: `{ page: number, limit: number, q?: string, sort: 'observation_date'|'name'|'created_at', order: 'asc'|'desc', category_id?: string, favorite?: boolean }`.
  - `MapBbox`: `{ min_lat:number, min_lng:number, max_lat:number, max_lng:number }`.
  - `PanelQueryParams` ≈ `ObservationListFilters` (bez bbox; bbox stan lokalny mapy).

## 6. Zarządzanie stanem

- TanStack Query:
  - `useObservations(filters)`: `['observations', filters]` → `GET /api/observations` (zwraca `items`, nagłówki → `PaginationMeta`).
  - `useMarkers(bbox, category_id?, favorite?)`: `['markers', {bbox, category_id, favorite}]` → `GET /api/observations/map`.
  - `useCategories()`: `['categories']` → `GET /api/categories` (`staleTime: 24h`).
  - `useProfile()`: `['profile']` → `GET /api/profile/me`.
- Mutacje:
  - `createObservation(dto)` → invalidacja `['observations', filters]`, `['markers', {bbox,...}]`.
  - `updateObservation(id,dto)` → j.w.
  - `deleteObservation(id)` → optimistic removal z rollbackiem.
- Lokalny stan:
  - `selectedObservationId: string|null` (wspólny dla listy i mapy).
  - `bbox: MapBbox` (ObservationMap; debounce 300 ms na ruch/zoom).
  - Kontrola modali i aktywnej zakładki (mobile).
- URL state: `filters` (page, limit, q, sort, order, category_id, favorite).

## 7. Integracja API

- Lista: `GET /api/observations?{page,limit,q,sort,order,category_id,favorite}` → mapowanie do `ObservationListItemVM[]`, `X-Total-Count` → `PaginationMeta`.
- Mapa: `GET /api/observations/map?{min_lat,min_lng,max_lat,max_lng,category_id?,favorite?}` → `MarkerVM[]`.
- Kategorie: `GET /api/categories` → zasilenie selecta.
- CRUD (z modali): `POST /api/observations`, `PATCH /api/observations/:id`, `DELETE /api/observations/:id` → invalidacje i optimistic updates.
- Auth: ochrona trasy i globalny interceptor 401 → logout + redirect `/auth/login`.

## 8. Interakcje użytkownika

- Klik wiersza listy → zaznacz element, przekaż `selectedObservationId` do mapy, centruj marker.
- Klik markera → ustaw `selectedObservationId`, pokaż tooltip z linkiem do szczegółów.
- Ruch/zoom mapy → po 300 ms aktualizuj `bbox` i pobierz markery.
- Wpis w `q` → debounce 300 ms i odśwież listę + reset `page=1`.
- Zmiana sort/order → aktualizacja URL i refetch listy.
- Paginacja → aktualizacja `page` w URL.
- Klik na mapie (dodanie) → otwórz `ObservationFormModal` z prefilled `{lat,lng}`.
- Edycja/Usunięcie → modale; po sukcesie podświetlenie wiersza 3 s.

## 9. Warunki i walidacja

- Zgodnie z `api-plan.md` (sekcja Validation):
  - `name` (1..100), `description` (≤500), `category_id` (wymagane), `observation_date` (ISO),
  - `location.lat` [-90..90], `location.lng` [-180..180], `location_source` w dozwolonym zbiorze,
  - BBOX: wartości w zakresach i `min < max`.
- Dodatkowo w UI: ograniczenie długości `q` (np. 200), white-list pól sortowania, sanitizacja wartości `order`.

## 10. Obsługa błędów

- 400/422: wyświetlanie błędów per pole w formularzu (mapowanie z `{error: { code, message, details }}`).
- 401: globalny logout + redirect `/auth/login`.
- 403: toast „Brak uprawnień”.
- 404: stany „Nie znaleziono” (np. szczegóły/edycja).
- 409: specyficzne komunikaty (np. brak kategorii, nieprawidłowe źródło lokalizacji).
- 500: toast z ID żądania (jeśli dostępny), zachowanie spójnego fallbacku UI.

## 11. Kroki implementacji

1. Routing i ochrona trasy `/panel` (guard z Supabase Auth).
2. Szkielet `PanelPage` + layout `PanelContent` (Tailwind grid: desktop 2 kolumny; mobile tabs).
3. Implementacja `PanelToolbar` z synchronizacją URL i debounce `q`.
4. Hooki danych (TanStack Query): `useObservations`, `useMarkers`, `useCategories`, `useProfile`.
5. `ObservationList` z paginacją, stanami (loading/empty/error), zaznaczeniem elementu.
6. `ObservationMap` (Leaflet) z bbox debounce, markerami i tooltipami; centrowanie na Polsce na start.
7. Wspólny stan `selectedObservationId` i logika synchronizacji lista↔mapa.
8. `ObservationFormModal` (create/edit) z walidacją, optimistic updates i invalidacjami.
9. `ConfirmDeleteModal` z optimistic removal i rollbackiem na błąd.
10. Obsługa błędów globalnych (interceptor) i toasty.
11. A11y: focus trap w modalach, aria-labels, aria-live; test tab order.
12. Testy manualne E2E: dodanie → widoczność na liście i mapie; krytyczna ścieżka z PRD.
