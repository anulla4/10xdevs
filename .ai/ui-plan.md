<conversation_summary>
<decisions>

1. Wybrano ścieżkę B: przygotowanie map podróży użytkownika (US-001..US-011).
2. Przyjęto listę 10 zaleceń (trasy, stan, debounce, walidacje, paginacja, błędy, A11y, TanStack Query, wydajność, bezpieczeństwo) jako bazę planu UI.
3. Potwierdzono, że dostarczone informacje są wystarczające do stworzenia wysokopoziomowego planu UI.
4. Ustalono top-level trasy: `/auth/*`, `/panel`, `/observations/:id`, `/settings/profile` oraz wspólny stan `selectedObservationId` i filtry w URL.
5. Ustalono zachowanie po logowaniu/rejestracji: fetch `GET /api/profile/me` → redirect do `/panel`; `401` powoduje logout + redirect `/auth/login`.
   </decisions>
   <matched_recommendations>
6. Architektura tras i hierarchia widoków (mapowanie na `/api/profile/me`, `/api/observations*`, `/api/categories`).
7. Przepływy auth: rejestracja/logowanie/reset z przekierowaniami zgodnie z PRD i API.
8. Wspólny stan między listą a mapą (`selectedObservationId`) + debounce bbox (300 ms) dla `/api/observations/map`.
9. Formularze tworzenia/edycji z walidacją wg `api-plan.md` (pola, zakresy, limity znaków, blokada `slug`).
10. Paginacja (20/strona), `q` z 300 ms debounce, sortowanie; stan filtrów w URL (`X-Total-Count` do nawigacji).
11. Globalne mapowanie błędów: 400/422 inline, 401 logout, 403 komunikat, 404 „Nie znaleziono”, 500 toast z ID.
12. A11y: focus trap, aria-labels, aria-live, kontrast WCAG AA, klawiatura.
13. Zarządzanie stanem i cache: TanStack Query, optimistic updates, `staleTime` dla kategorii (24h).
14. Wydajność: bbox dla mapy, debounce ruchów, prefetch kategorii, lazy-load Leaflet, paginate listy.
15. Bezpieczeństwo: sesja Supabase (bez ręcznego JWT), HTTPS, CORS na backendzie, modale potwierdzeń i reauth dla akcji destrukcyjnych.
    </matched_recommendations>
    <ui_architecture_planning_summary>

- **Główne wymagania (PRD)**: Auth (rejestracja/logowanie/reset/usunięcie), CRUD obserwacji, lista z paginacją/sort/q, mapa pinezek z tooltipami, widok szczegółów, layout desktop 2 kolumny i mobile zakładki, modale potwierdzeń, spinnery, podświetlenie zmian, WCAG AA.
- **Kluczowe widoki i ekrany**:
  - **Auth**: `Login`, `Register`, `Forgot`, `Reset` (Supabase Auth integracja).
  - **Panel**: layout 2-kolumnowy (desktop) lub zakładki Lista/Mapa (mobile).
  - **Lista obserwacji**: `GET /api/observations` z paginacją, filtrami, sort.
  - **Mapa**: `GET /api/observations/map` z bbox; tooltip: nazwa, data, link do szczegółów.
  - **Szczegóły obserwacji**: `GET /api/observations/:id`.
  - **Formularz obserwacji**: `POST /api/observations`, `PATCH /api/observations/:id`.
  - **Ustawienia profilu**: `GET/PATCH /api/profile/me`.
- **Przepływy użytkownika (US-001..US-011)**: przygotowane mapy obejmują wejście → akcje → API → nawigację → stany (sukces/pusty/błąd) dla rejestracji, logowania, resetu, usunięcia konta, dodania/edycji/usunięcia obserwacji, przeglądania listy i mapy, wyszukiwania/sortowania oraz wymagań A11y.
- **Integracja z API i stanem**:
  - Klucze TanStack Query per zasób i filtr (np. `['observations', {page, limit, q, sort, order}]`, `['markers', {bbox, category_id, favorite}]`, `['categories']`, `['profile']`).
  - **Refetch/invalidacja**: po POST/PATCH/DELETE invalidować zapytania listy i mapy; optimistic updates z rollbackiem.
  - **Wspólny stan**: `selectedObservationId` między listą i mapą; filtry w URL dla deep-linking.
  - **Debounce**: `q` i bbox (300 ms) dla ograniczenia wywołań API.
- **Responsywność**: desktop (2 kolumny), mobile (zakładki), domyślne wyśrodkowanie mapy na Polskę; lazy-load komponentu Leaflet.
- **Dostępność**: focus trap w modalach, aria-labels na przyciskach i pinezkach, aria-live dla błędów/sukcesów, kontrast AA, pełna obsługa klawiatury i kolejność tabbingu.
- **Bezpieczeństwo**: Supabase Auth (JWT zarządzany przez SDK), RLS egzekwowany przez backend, brak ekspozycji service role w kliencie, CORS ograniczony do domen frontendu, potwierdzenia akcji destrukcyjnych i reauth przy usunięciu konta.
  </ui_architecture_planning_summary>
  <unresolved_issues>

1. Branding i UI kit: paleta, typografia, styl ikon dla `categories.icon`.
2. Dokładne breakpointy i zakres wsparcia przeglądarek.
3. i18n: czy tylko PL w MVP, czy przygotować mechanizm tłumaczeń?
4. Formatowanie dat i strefa czasowa w UI (prezentacja vs input ISO-8601).
5. Domyślny zoom/start pozycji mapy (PRD wskazuje Polskę – doprecyzować zoom).
6. Copy komunikatów błędów/sukcesów (ostateczne treści, ton głosu).
7. Czy użyć gotowych komponentów Auth Supabase, czy w pełni custom?
8. Zakres testów dostępności (manualne e2e vs automaty przez axe/lighthouse).
   </unresolved_issues>
   </conversation_summary>
