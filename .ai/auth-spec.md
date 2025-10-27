# Specyfikacja techniczna modułu autentykacji - Nature Log

## 1. WPROWADZENIE

### 1.1 Cel dokumentu

Niniejszy dokument opisuje szczegółową architekturę modułu rejestracji, logowania i odzyskiwania hasła użytkowników dla aplikacji Nature Log. Specyfikacja jest zgodna z wymaganiami z PRD oraz istniejącym stackiem technologicznym (Astro 5 SSR, React 19, Supabase Auth, TypeScript 5, Tailwind CSS 4).

### 1.2 Zakres funkcjonalny

- Rejestracja użytkownika (e-mail + hasło)
- Logowanie użytkownika
- Wylogowanie
- Reset hasła (link ważny 1h)
- Usunięcie konta z potwierdzeniem hasłem
- Ochrona zasobów (auth guards)
- Integracja z istniejącym panelem obserwacji

### 1.3 Kluczowe założenia

- **Brak OAuth**: MVP nie wspiera logowania przez Google/GitHub
- **Server-Side Rendering**: Astro 5 w trybie `output: "server"` z adapterem Node.js
- **Supabase Auth**: Wykorzystanie wbudowanego systemu uwierzytelniania Supabase
- **Row Level Security**: Istniejące polityki RLS w bazie danych pozostają aktywne
- **Zachowanie kompatybilności**: Nie można naruszyć działania istniejących endpointów API i komponentów panelu

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron (Astro Pages)

#### 2.1.1 Nowe strony do utworzenia

**`/src/pages/auth/register.astro`**

- **Ścieżka URL**: `/auth/register`
- **Tryb renderowania**: Server-Side Rendering (SSR)
- **Odpowiedzialność**:
  - Sprawdzenie czy użytkownik jest już zalogowany (jeśli tak → redirect do `/panel`)
  - Renderowanie layoutu z komponentem `RegisterForm` (React)
  - Obsługa query params: `?redirectTo=/panel` (przekazywany do formularza)
- **Struktura**:

  ```typescript
  // Frontmatter (server-side)
  - Pobranie sesji z Astro.locals.supabase.auth.getSession()
  - Jeśli session istnieje → return Astro.redirect('/panel')
  - Odczyt query param 'redirectTo' z Astro.url.searchParams

  // Template
  - Layout z tytułem "Rejestracja - Nature Log"
  - Komponent RegisterForm (client:load)
  - Link do /auth/login ("Masz już konto? Zaloguj się")
  ```

**`/src/pages/auth/login.astro`**

- **Ścieżka URL**: `/auth/login`
- **Tryb renderowania**: SSR
- **Odpowiedzialność**:
  - Sprawdzenie czy użytkownik jest już zalogowany (jeśli tak → redirect do `/panel`)
  - Renderowanie layoutu z komponentem `LoginForm` (React)
  - Obsługa query params: `?redirectTo=/panel&error=unauthorized`
- **Struktura**:

  ```typescript
  // Frontmatter (server-side)
  - Pobranie sesji z Astro.locals.supabase.auth.getSession()
  - Jeśli session istnieje → return Astro.redirect('/panel')
  - Odczyt query params: 'redirectTo', 'error'

  // Template
  - Layout z tytułem "Logowanie - Nature Log"
  - Komponent LoginForm (client:load) z props: redirectTo, error
  - Link do /auth/register ("Nie masz konta? Zarejestruj się")
  - Link do /auth/reset-password ("Zapomniałeś hasła?")
  ```

**`/src/pages/auth/reset-password.astro`**

- **Ścieżka URL**: `/auth/reset-password`
- **Tryb renderowania**: SSR
- **Odpowiedzialność**:
  - Renderowanie formularza do wysłania linku resetującego hasło
  - Nie wymaga zalogowania
- **Struktura**:

  ```typescript
  // Frontmatter (server-side)
  - Brak logiki auth guard (dostępne dla niezalogowanych)

  // Template
  - Layout z tytułem "Reset hasła - Nature Log"
  - Komponent ResetPasswordForm (client:load)
  - Link do /auth/login ("Wróć do logowania")
  ```

**`/src/pages/auth/update-password.astro`**

- **Ścieżka URL**: `/auth/update-password`
- **Tryb renderowania**: SSR
- **Odpowiedzialność**:
  - Renderowanie formularza do ustawienia nowego hasła
  - Walidacja tokenu resetującego (przekazanego w URL przez Supabase)
  - Obsługa wygaśnięcia tokenu (1h)
- **Struktura**:

  ```typescript
  // Frontmatter (server-side)
  - Odczyt hash fragmentu z URL (Supabase przekazuje token w #access_token=...)
  - Weryfikacja czy token jest obecny
  - Jeśli brak tokenu → redirect do /auth/reset-password?error=invalid_token

  // Template
  - Layout z tytułem "Ustaw nowe hasło - Nature Log"
  - Komponent UpdatePasswordForm (client:load)
  - Informacja o czasie ważności linku (1h)
  ```

**`/src/pages/auth/logout.astro`**

- **Ścieżka URL**: `/auth/logout`
- **Tryb renderowania**: SSR
- **Odpowiedzialność**:
  - Wykonanie wylogowania po stronie serwera
  - Przekierowanie do strony głównej lub logowania
- **Struktura**:

  ```typescript
  // Frontmatter (server-side)
  - Wywołanie Astro.locals.supabase.auth.signOut()
  - Usunięcie ciasteczek sesji
  - return Astro.redirect('/auth/login')

  // Template
  - Brak (redirect natychmiastowy)
  ```

#### 2.1.2 Modyfikacje istniejących stron

**`/src/pages/index.astro`**

- **Obecny stan**: Renderuje `PanelPage` z mock user ID
- **Wymagane zmiany**:
  - Zmiana na stronę powitalną (landing page) dla niezalogowanych użytkowników
  - Dla zalogowanych użytkowników → redirect do `/panel`
- **Nowa struktura**:

  ```typescript
  // Frontmatter
  - Pobranie sesji z Astro.locals.supabase.auth.getSession()
  - Jeśli session istnieje → return Astro.redirect('/panel')

  // Template
  - Layout z tytułem "Nature Log - Twoje obserwacje przyrody"
  - Komponent WelcomePage (nowy komponent React lub Astro)
  - Przyciski CTA: "Zarejestruj się" → /auth/register, "Zaloguj się" → /auth/login
  - Krótki opis aplikacji i jej możliwości
  ```

**`/src/pages/panel.astro`**

- **Obecny stan**: Zakomentowany kod z auth guard, używa mock user ID
- **Wymagane zmiany**:
  - Odkomentowanie i aktywacja auth guard
  - Usunięcie mock user ID
  - Przekazanie rzeczywistego user ID do komponentu PanelPage
- **Nowa struktura**:

  ```typescript
  // Frontmatter
  - Pobranie sesji z Astro.locals.supabase.auth.getSession()
  - Jeśli !session → return Astro.redirect('/auth/login?redirectTo=/panel')
  - Pobranie userId z session.user.id

  // Template
  - Layout z tytułem "Panel - Nature Log"
  - Komponent PanelPage (client:only="react") z props: userId
  - Bez zmian w strukturze komponentu
  ```

### 2.2 Komponenty React (Client-Side)

#### 2.2.1 Nowe komponenty formularzy autentykacji

**`/src/components/auth/RegisterForm.tsx`**

- **Odpowiedzialność**: Formularz rejestracji z walidacją client-side
- **Props**:
  ```typescript
  interface RegisterFormProps {
    redirectTo?: string; // domyślnie '/panel'
  }
  ```
- **Stan lokalny**:
  ```typescript
  - email: string
  - password: string
  - confirmPassword: string
  - isLoading: boolean
  - error: string | null
  ```
- **Pola formularza**:
  1. **E-mail** (type="email", required)
     - Walidacja: format e-mail, niepuste
     - Komunikat błędu: "Podaj prawidłowy adres e-mail"
  2. **Hasło** (type="password", required)
     - Walidacja: min. 8 znaków, zawiera wielką literę, małą literę, cyfrę
     - Komunikat błędu: "Hasło musi mieć min. 8 znaków i zawierać wielką literę, małą literę oraz cyfrę"
  3. **Potwierdź hasło** (type="password", required)
     - Walidacja: zgodność z polem "Hasło"
     - Komunikat błędu: "Hasła nie są zgodne"
- **Logika submit**:
  1. Walidacja client-side (wszystkie pola)
  2. Wywołanie `POST /api/auth/register` z body: `{ email, password }`
  3. Obsługa odpowiedzi:
     - **Sukces (201)**: Automatyczne logowanie + redirect do `redirectTo`
     - **Błąd (400)**: Wyświetlenie komunikatu (np. "E-mail jest już zarejestrowany")
     - **Błąd (500)**: "Wystąpił błąd serwera. Spróbuj ponownie."
  4. Podczas ładowania: disabled inputs + spinner w przycisku
- **UI/UX**:
  - Wykorzystanie komponentów z `/src/components/ui/`: `Input`, `Button`, `Label`
  - Inline error messages pod każdym polem (kolor czerwony)
  - Przycisk "Zarejestruj się" (primary button)
  - Link do `/auth/login` pod formularzem

**`/src/components/auth/LoginForm.tsx`**

- **Odpowiedzialność**: Formularz logowania
- **Props**:
  ```typescript
  interface LoginFormProps {
    redirectTo?: string; // domyślnie '/panel'
    error?: string; // np. 'unauthorized' z query params
  }
  ```
- **Stan lokalny**:
  ```typescript
  - email: string
  - password: string
  - isLoading: boolean
  - error: string | null
  ```
- **Pola formularza**:
  1. **E-mail** (type="email", required)
  2. **Hasło** (type="password", required)
- **Logika submit**:
  1. Walidacja client-side (niepuste pola)
  2. Wywołanie `POST /api/auth/login` z body: `{ email, password }`
  3. Obsługa odpowiedzi:
     - **Sukces (200)**: Redirect do `redirectTo` (pełne przeładowanie strony: `window.location.href`)
     - **Błąd (401)**: "Nieprawidłowy e-mail lub hasło"
     - **Błąd (500)**: "Wystąpił błąd serwera. Spróbuj ponownie."
  4. Podczas ładowania: disabled inputs + spinner
- **UI/UX**:
  - Wyświetlenie komunikatu z props.error (jeśli przekazany)
  - Komponenty UI: `Input`, `Button`, `Label`
  - Przycisk "Zaloguj się" (primary)
  - Linki: "Zapomniałeś hasła?" → `/auth/reset-password`, "Nie masz konta?" → `/auth/register`

**`/src/components/auth/ResetPasswordForm.tsx`**

- **Odpowiedzialność**: Formularz do wysłania linku resetującego hasło
- **Props**: Brak
- **Stan lokalny**:
  ```typescript
  - email: string
  - isLoading: boolean
  - isSuccess: boolean
  - error: string | null
  ```
- **Pola formularza**:
  1. **E-mail** (type="email", required)
- **Logika submit**:
  1. Walidacja client-side (format e-mail)
  2. Wywołanie `POST /api/auth/reset-password` z body: `{ email }`
  3. Obsługa odpowiedzi:
     - **Sukces (200)**: Wyświetlenie komunikatu "Link resetujący został wysłany na podany adres e-mail. Sprawdź swoją skrzynkę."
     - **Błąd (500)**: "Wystąpił błąd. Spróbuj ponownie."
  4. Uwaga: Endpoint zawsze zwraca sukces (nawet jeśli e-mail nie istnieje) ze względów bezpieczeństwa
- **UI/UX**:
  - Po sukcesie: ukrycie formularza, wyświetlenie komunikatu sukcesu (zielony box)
  - Przycisk "Wyślij link" (primary)
  - Link "Wróć do logowania" → `/auth/login`

**`/src/components/auth/UpdatePasswordForm.tsx`**

- **Odpowiedzialność**: Formularz do ustawienia nowego hasła
- **Props**: Brak (token pobierany z URL hash)
- **Stan lokalny**:
  ```typescript
  - password: string
  - confirmPassword: string
  - isLoading: boolean
  - error: string | null
  ```
- **Pola formularza**:
  1. **Nowe hasło** (type="password", required)
     - Walidacja: min. 8 znaków, wielka litera, mała litera, cyfra
  2. **Potwierdź hasło** (type="password", required)
     - Walidacja: zgodność z polem "Nowe hasło"
- **Logika submit**:
  1. Walidacja client-side
  2. Wywołanie `POST /api/auth/update-password` z body: `{ password }`
  3. Obsługa odpowiedzi:
     - **Sukces (200)**: Redirect do `/auth/login` z komunikatem "Hasło zostało zmienione. Możesz się teraz zalogować."
     - **Błąd (401)**: "Link wygasł lub jest nieprawidłowy. Wygeneruj nowy link."
     - **Błąd (500)**: "Wystąpił błąd. Spróbuj ponownie."
- **UI/UX**:
  - Informacja o czasie ważności linku (1h)
  - Przycisk "Zmień hasło" (primary)
  - Link "Wygeneruj nowy link" → `/auth/reset-password`

#### 2.2.2 Modyfikacje istniejących komponentów

**`/src/layouts/Layout.astro`**

- **Obecny stan**: Prosty layout bez nawigacji
- **Wymagane zmiany**:
  - Dodanie nagłówka (header) z nawigacją
  - Wyświetlanie przycisków w zależności od stanu autentykacji
- **Nowa struktura**:

  ```typescript
  // Frontmatter
  - Pobranie sesji z Astro.locals.supabase.auth.getSession()
  - Przekazanie stanu autentykacji do komponentu Header

  // Template
  - <Header isAuthenticated={!!session} user={session?.user} />
  - <main><slot /></main>
  - <Footer /> (nowy komponent z linkami do Polityki Prywatności i Regulaminu)
  ```

**`/src/components/layout/Header.tsx`** (nowy komponent)

- **Odpowiedzialność**: Nawigacja główna z przyciskami auth
- **Props**:
  ```typescript
  interface HeaderProps {
    isAuthenticated: boolean;
    user?: { email?: string };
  }
  ```
- **Renderowanie**:
  - **Dla niezalogowanych**:
    - Logo/nazwa aplikacji (link do `/`)
    - Przycisk "Zaloguj się" → `/auth/login` (prawy górny róg)
  - **Dla zalogowanych**:
    - Logo/nazwa aplikacji (link do `/panel`)
    - E-mail użytkownika (opcjonalnie)
    - Link "Panel" → `/panel`
    - Przycisk "Wyloguj" → `/auth/logout` (prawy górny róg)
- **UI/UX**:
  - Sticky header (fixed top)
  - Tailwind CSS: flex justify-between, padding, shadow
  - Responsive: na mobile hamburger menu (opcjonalnie w przyszłości)

**`/src/components/panel/PanelPage.tsx`**

- **Obecny stan**: Przyjmuje `userId` jako prop
- **Wymagane zmiany**: Brak (komponent pozostaje bez zmian)
- **Uwaga**: Komponent już jest przygotowany na rzeczywisty `userId` - wystarczy przekazać go z `panel.astro`

### 2.3 Walidacja i komunikaty błędów

#### 2.3.1 Walidacja client-side (React)

**Reguły walidacji**:

1. **E-mail**:
   - Format: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Komunikat: "Podaj prawidłowy adres e-mail"
2. **Hasło**:
   - Min. 8 znaków
   - Zawiera wielką literę, małą literę, cyfrę
   - Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`
   - Komunikat: "Hasło musi mieć min. 8 znaków i zawierać wielką literę, małą literę oraz cyfrę"
3. **Potwierdź hasło**:
   - Zgodność z polem "Hasło"
   - Komunikat: "Hasła nie są zgodne"

**Implementacja**:

- Walidacja w czasie rzeczywistym (onChange) lub po blur
- Wyświetlanie błędów inline pod polami (czerwony tekst)
- Disabled submit button jeśli formularz nieprawidłowy

#### 2.3.2 Komunikaty błędów z API

**Mapowanie błędów**:

- **400 Bad Request**: "Nieprawidłowe dane. Sprawdź formularz."
- **401 Unauthorized**: "Nieprawidłowy e-mail lub hasło"
- **409 Conflict**: "E-mail jest już zarejestrowany"
- **500 Internal Server Error**: "Wystąpił błąd serwera. Spróbuj ponownie."
- **Network Error**: "Brak połączenia z serwerem. Sprawdź połączenie internetowe."

**Wyświetlanie**:

- Alert box na górze formularza (czerwone tło, ikona błędu)
- Auto-hide po 5 sekundach (opcjonalnie)
- Możliwość ręcznego zamknięcia (X button)

### 2.4 Scenariusze użytkownika (User Flows)

#### 2.4.1 Rejestracja nowego użytkownika

1. Użytkownik wchodzi na `/` → widzi landing page
2. Klika "Zarejestruj się" → redirect do `/auth/register`
3. Wypełnia formularz (e-mail, hasło, potwierdź hasło)
4. Klika "Zarejestruj się"
5. System:
   - Waliduje dane client-side
   - Wysyła POST do `/api/auth/register`
   - Tworzy konto w Supabase Auth
   - Tworzy profil w tabeli `profiles`
   - Automatycznie loguje użytkownika
   - Zwraca sesję
6. Użytkownik jest przekierowywany do `/panel`
7. Header pokazuje "Wyloguj" i link do panelu

#### 2.4.2 Logowanie istniejącego użytkownika

1. Użytkownik wchodzi na `/` → widzi landing page
2. Klika "Zaloguj się" → redirect do `/auth/login`
3. Wypełnia formularz (e-mail, hasło)
4. Klika "Zaloguj się"
5. System:
   - Waliduje dane client-side
   - Wysyła POST do `/api/auth/login`
   - Weryfikuje credentials w Supabase Auth
   - Zwraca sesję
6. Użytkownik jest przekierowywany do `/panel`
7. Header pokazuje "Wyloguj" i link do panelu

#### 2.4.3 Reset hasła

1. Użytkownik na stronie `/auth/login` klika "Zapomniałeś hasła?"
2. Redirect do `/auth/reset-password`
3. Wypełnia formularz (e-mail)
4. Klika "Wyślij link"
5. System:
   - Wysyła POST do `/api/auth/reset-password`
   - Supabase wysyła e-mail z linkiem (ważny 1h)
   - Wyświetla komunikat sukcesu
6. Użytkownik otwiera e-mail i klika link
7. Link prowadzi do `/auth/update-password?token=...`
8. Wypełnia formularz (nowe hasło, potwierdź hasło)
9. Klika "Zmień hasło"
10. System:
    - Wysyła POST do `/api/auth/update-password`
    - Aktualizuje hasło w Supabase Auth
    - Redirect do `/auth/login` z komunikatem sukcesu
11. Użytkownik loguje się nowym hasłem

#### 2.4.4 Wylogowanie

1. Zalogowany użytkownik klika "Wyloguj" w headerze
2. Redirect do `/auth/logout`
3. System:
   - Wywołuje `supabase.auth.signOut()` po stronie serwera
   - Usuwa ciasteczka sesji
   - Redirect do `/auth/login`
4. Header pokazuje "Zaloguj się"

#### 2.4.5 Usunięcie konta

1. Zalogowany użytkownik wchodzi do `/panel` (lub dedykowana strona `/settings`)
2. Klika "Usuń konto" (w przyszłości: w sekcji ustawień)
3. System wyświetla modal z potwierdzeniem:
   - Pole "Wpisz hasło"
   - Checkbox "Potwierdzam usunięcie konta i wszystkich danych"
   - Przycisk "Usuń konto" (czerwony, destructive)
4. Użytkownik wypełnia hasło i potwierdza
5. System:
   - Wysyła DELETE do `/api/auth/account`
   - Weryfikuje hasło
   - Usuwa użytkownika z Supabase Auth (kaskadowo usuwa profil i obserwacje)
   - Wylogowuje użytkownika
   - Redirect do `/` z komunikatem "Konto zostało usunięte"

#### 2.4.6 Ochrona zasobów (Auth Guard)

1. Niezalogowany użytkownik próbuje wejść na `/panel`
2. System:
   - Sprawdza sesję w `panel.astro` (frontmatter)
   - Brak sesji → redirect do `/auth/login?redirectTo=/panel`
3. Użytkownik widzi formularz logowania
4. Po zalogowaniu → redirect do `/panel` (z `redirectTo`)

---

## 3. LOGIKA BACKENDOWA

### 3.1 Endpointy API

#### 3.1.1 POST /api/auth/register

**Plik**: `/src/pages/api/auth/register.ts`

**Request Body**: `{ email: string, password: string }`

**Response**: 201 Created z `{ user, session }` lub błędy 400/409/500

**Logika**: Walidacja → `supabase.auth.signUp()` → utworzenie profilu → zwrot sesji

#### 3.1.2 POST /api/auth/login

**Plik**: `/src/pages/api/auth/login.ts`

**Request Body**: `{ email: string, password: string }`

**Response**: 200 OK z `{ user, session }` lub błędy 401/500

**Logika**: Walidacja → `supabase.auth.signInWithPassword()` → zwrot sesji

#### 3.1.3 POST /api/auth/reset-password

**Plik**: `/src/pages/api/auth/reset-password.ts`

**Request Body**: `{ email: string }`

**Response**: 200 OK (zawsze, security best practice)

**Logika**: Walidacja → `supabase.auth.resetPasswordForEmail()` → Supabase wysyła e-mail z linkiem (ważny 1h)

#### 3.1.4 POST /api/auth/update-password

**Plik**: `/src/pages/api/auth/update-password.ts`

**Request Body**: `{ password: string }`

**Headers**: `Authorization: Bearer <token>` (z URL hash)

**Response**: 200 OK lub błędy 401/500

**Logika**: Pobranie tokenu → walidacja → `supabase.auth.updateUser({ password })` → zwrot sukcesu

#### 3.1.5 DELETE /api/auth/account

**Plik**: `/src/pages/api/auth/account.ts`

**Request Body**: `{ password: string }`

**Response**: 200 OK lub błędy 401/500

**Logika**: Sprawdzenie sesji → weryfikacja hasła → `supabase.auth.admin.deleteUser()` → kaskadowe usunięcie danych → wylogowanie

### 3.2 Middleware i Auth Guards

#### 3.2.1 Modyfikacja `/src/middleware/index.ts`

**Zmiana**: Automatyczne wyciąganie `userId` z sesji Supabase:

```typescript
const {
  data: { session },
} = await supabaseClient.auth.getSession();
context.locals.userId = session?.user?.id;
```

**Wpływ**: Wszystkie endpointy API mogą używać `Astro.locals.userId` zamiast mock ID

#### 3.2.2 Auth guard helper `/src/lib/auth-guards.ts` (nowy)

**Funkcje**:

- `requireAuth(Astro, redirectTo?)` - wymaga zalogowania, inaczej redirect do `/auth/login`
- `requireGuest(Astro)` - wymaga braku sesji, inaczej redirect do `/panel`
- `getSession(Astro)` - pobiera sesję (opcjonalnie)

**Użycie w stronach Astro**:

```typescript
import { requireAuth } from '../lib/auth-guards';
const session = await requireAuth(Astro, '/panel');
```

### 3.3 Modyfikacja istniejących endpointów

**Pliki**: `/src/pages/api/observations.ts`, `/src/pages/api/observations/[id].ts`, `/src/pages/api/profile/me.ts`

**Zmiany**:

1. Usunięcie mock `userId`
2. Użycie `Astro.locals.userId` z middleware
3. Sprawdzenie autoryzacji: `if (!userId) return 401`

**Uwaga**: Istniejące serwisy już przyjmują `userId` - wystarczy przekazać rzeczywisty ID

### 3.4 Walidacja danych

**Plik**: `/src/lib/validation/auth.validation.ts` (nowy)

**Funkcje**:

- `validateEmail(email)` - sprawdza format e-mail
- `validatePassword(password)` - min. 8 znaków, wielka/mała litera, cyfra
- `validateRegisterInput(data)` - waliduje cały formularz rejestracji

**Użycie**: Walidacja w endpointach API przed wywołaniem Supabase

### 3.5 Obsługa sesji

**Mechanizm**: Supabase używa HTTP-only cookies do przechowywania tokenów

**Konfiguracja** w `/src/db/supabase.client.ts`:

```typescript
export const supabaseClient = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce', // Zalecane dla SSR
  },
});
```

**Bezpieczeństwo**: HTTP-only, Secure (HTTPS), SameSite=Lax

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Integracja Supabase Auth z Astro

**Architektura przepływu**:

```
User → React Form → API Endpoint → Supabase Auth → Database
                                        ↓
                                   JWT Token (cookies)
                                        ↓
                            Astro Middleware (session)
                                        ↓
                              Astro.locals.userId
```

**Komponenty**:

1. **Supabase Auth**: Zarządzanie użytkownikami, JWT, e-maile
2. **Astro Middleware**: Wyciąganie sesji z cookies
3. **Astro Pages**: Auth guards, renderowanie
4. **React Components**: Formularze, walidacja client-side
5. **API Endpoints**: Wywołania Supabase Auth, walidacja server-side

### 4.2 Row Level Security (RLS)

**Obecny stan**: Polityki RLS sprawdzają `auth.uid()` z JWT tokenu

**Zgodność**: Po zalogowaniu Supabase client automatycznie dodaje JWT do requestów → RLS działa automatycznie

**Przykład polityki** (już istniejąca):

```sql
CREATE POLICY "allow_authenticated_select_own_observations"
ON observations FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

**Uwaga**: Nie wymagane żadne zmiany w politykach RLS

### 4.3 Konfiguracja Supabase

**Supabase Dashboard → Authentication → Settings**:

1. **Site URL**: `https://[DOMAIN]` lub `http://localhost:3000`
2. **Redirect URLs**: `https://[DOMAIN]/auth/update-password`
3. **Email Templates**: Dostosowanie treści (opcjonalnie)
4. **Password Requirements**: Min. 8 znaków
5. **Session Settings**: JWT expiry 1h, refresh token 30 dni

**Zmienne środowiskowe** (`.env`):

```env
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY] # Tylko dla admin ops
```

### 4.4 Bezpieczeństwo

**Zabezpieczenia**:

1. **Walidacja**: Client-side (UX) + Server-side (security)
2. **Ochrona przed atakami**: SQL Injection (prepared statements), XSS (auto-escape), CSRF (SameSite cookies)
3. **Hasła**: Hashowanie przez Supabase, wymuszanie silnych haseł
4. **Sesje**: HTTP-only cookies, auto-refresh, wylogowanie server-side
5. **API**: Sprawdzanie autoryzacji, walidacja inputów, logowanie błędów

**Logowanie błędów**: Użycie istniejącego `logger` z `/src/lib/logger.ts` (bez logowania haseł!)

**Produkcja**: HTTPS, secure cookies, CORS, environment variables w bezpieczny sposób

---

## 5. MIGRACJE BAZODANOWE

### 5.1 Schemat bazy danych

**Obecny stan**: Tabela `profiles` istnieje i jest połączona z `auth.users`

**Wymagane zmiany**: Brak - istniejący schemat jest kompatybilny

### 5.2 Trigger dla auto-tworzenia profilu (opcjonalnie)

**Plik**: `/supabase/migrations/[TIMESTAMP]_auto_create_profile.sql`

**Treść**:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.email, 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

**Alternatywa**: Tworzenie profilu w endpoincie `/api/auth/register`

**Zalecenie**: Trigger jest czystszy i zapewnia spójność danych

---

## 6. PODSUMOWANIE IMPLEMENTACJI

### 6.1 Nowe pliki do utworzenia

**Strony Astro** (5 plików):

- `/src/pages/auth/register.astro`
- `/src/pages/auth/login.astro`
- `/src/pages/auth/reset-password.astro`
- `/src/pages/auth/update-password.astro`
- `/src/pages/auth/logout.astro`

**Komponenty React** (5 plików):

- `/src/components/auth/RegisterForm.tsx`
- `/src/components/auth/LoginForm.tsx`
- `/src/components/auth/ResetPasswordForm.tsx`
- `/src/components/auth/UpdatePasswordForm.tsx`
- `/src/components/layout/Header.tsx`

**API Endpoints** (5 plików):

- `/src/pages/api/auth/register.ts`
- `/src/pages/api/auth/login.ts`
- `/src/pages/api/auth/reset-password.ts`
- `/src/pages/api/auth/update-password.ts`
- `/src/pages/api/auth/account.ts`

**Utilities** (2 pliki):

- `/src/lib/auth-guards.ts`
- `/src/lib/validation/auth.validation.ts`

**Migracje** (1 plik, opcjonalnie):

- `/supabase/migrations/[TIMESTAMP]_auto_create_profile.sql`

### 6.2 Pliki do modyfikacji

**Strony Astro**:

- `/src/pages/index.astro` - zmiana na landing page z CTA
- `/src/pages/panel.astro` - aktywacja auth guard

**Layout**:

- `/src/layouts/Layout.astro` - dodanie Header z nawigacją

**Middleware**:

- `/src/middleware/index.ts` - wyciąganie userId z sesji

**Supabase Client**:

- `/src/db/supabase.client.ts` - konfiguracja dla SSR

**API Endpoints** (istniejące):

- `/src/pages/api/observations.ts` - użycie rzeczywistego userId
- `/src/pages/api/observations/[id].ts` - użycie rzeczywistego userId
- `/src/pages/api/profile/me.ts` - użycie rzeczywistego userId

### 6.3 Kolejność implementacji (zalecana)

**Faza 1: Infrastruktura** (backend)

1. Modyfikacja `/src/middleware/index.ts` (userId z sesji)
2. Utworzenie `/src/lib/auth-guards.ts`
3. Utworzenie `/src/lib/validation/auth.validation.ts`
4. Konfiguracja Supabase (dashboard + `.env`)
5. Migracja bazodanowa (trigger, opcjonalnie)

**Faza 2: API Endpoints** 6. `/src/pages/api/auth/register.ts` 7. `/src/pages/api/auth/login.ts` 8. `/src/pages/api/auth/reset-password.ts` 9. `/src/pages/api/auth/update-password.ts` 10. `/src/pages/api/auth/account.ts`

**Faza 3: Komponenty UI** 11. `/src/components/auth/RegisterForm.tsx` 12. `/src/components/auth/LoginForm.tsx` 13. `/src/components/auth/ResetPasswordForm.tsx` 14. `/src/components/auth/UpdatePasswordForm.tsx` 15. `/src/components/layout/Header.tsx`

**Faza 4: Strony Astro** 16. `/src/pages/auth/register.astro` 17. `/src/pages/auth/login.astro` 18. `/src/pages/auth/reset-password.astro` 19. `/src/pages/auth/update-password.astro` 20. `/src/pages/auth/logout.astro` 21. Modyfikacja `/src/pages/index.astro` 22. Modyfikacja `/src/pages/panel.astro` 23. Modyfikacja `/src/layouts/Layout.astro`

**Faza 5: Integracja z istniejącymi endpointami** 24. Aktualizacja `/src/pages/api/observations.ts` 25. Aktualizacja `/src/pages/api/observations/[id].ts` 26. Aktualizacja `/src/pages/api/profile/me.ts`

**Faza 6: Testowanie** 27. Testy manualne wszystkich scenariuszy 28. Weryfikacja auth guards 29. Weryfikacja RLS policies 30. Testy end-to-end (opcjonalnie)

### 6.4 Kluczowe kontrakty i interfejsy

**TypeScript Types** (do dodania w `/src/types.ts`):

```typescript
// Auth DTOs
export type AuthUser = {
  id: string;
  email: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ResetPasswordRequest = {
  email: string;
};

export type UpdatePasswordRequest = {
  password: string;
};

export type DeleteAccountRequest = {
  password: string;
};
```

**Props Interfaces**:

```typescript
// RegisterForm
interface RegisterFormProps {
  redirectTo?: string;
}

// LoginForm
interface LoginFormProps {
  redirectTo?: string;
  error?: string;
}

// Header
interface HeaderProps {
  isAuthenticated: boolean;
  user?: { email?: string };
}
```

### 6.5 Zgodność z istniejącym kodem

**Zachowana funkcjonalność**:

- Wszystkie istniejące endpointy API (`/api/observations`, `/api/categories`, `/api/profile`) działają bez zmian
- Komponenty panelu (`PanelPage`, `ObservationList`, `ObservationMap`) działają bez zmian
- Serwisy (`observations.service.ts`, `profile.service.ts`) działają bez zmian
- Schema bazy danych pozostaje bez zmian
- RLS policies pozostają bez zmian

**Dodane funkcjonalności**:

- Autentykacja użytkowników (rejestracja, logowanie, reset hasła)
- Auth guards dla chronionych stron
- Header z nawigacją i przyciskami auth
- Landing page dla niezalogowanych użytkowników
- Rzeczywisty userId zamiast mock ID

**Brak breaking changes**: Istniejący kod nie wymaga refaktoryzacji, tylko rozszerzenia

---

## 7. UWAGI KOŃCOWE

### 7.1 Wymagania z PRD - pokrycie

✅ **Rejestracja**: Formularz z e-mail, hasło, potwierdzenie hasła, walidacja, automatyczne logowanie

✅ **Logowanie**: Formularz e-mail/hasło, komunikaty błędów, przekierowanie do panelu

✅ **Reset hasła**: Link ważny 1h, formularz zmiany hasła, e-mail z Supabase

✅ **Wylogowanie**: Przycisk w headerze, wylogowanie server-side, przekierowanie

✅ **Usunięcie konta**: Potwierdzenie hasłem, modal, kaskadowe usunięcie danych

✅ **Ochrona zasobów**: Auth guards na `/panel`, przekierowanie z `redirectTo`

✅ **Layout**: Header z przyciskami "Zaloguj"/"Wyloguj" w zależności od stanu auth

✅ **Dedykowane strony**: `/register`, `/login`, `/reset-password`, `/update-password`

### 7.2 Stack technologiczny - zgodność

✅ **Astro 5**: SSR z `output: "server"`, auth guards w frontmatter

✅ **React 19**: Komponenty formularzy z `client:load`

✅ **Supabase Auth**: Pełna integracja z Astro, RLS, JWT

✅ **TypeScript 5**: Typy dla wszystkich komponentów i API

✅ **Tailwind CSS 4**: Stylowanie formularzy i nawigacji

### 7.3 Bezpieczeństwo - best practices

✅ **Walidacja**: Client-side + Server-side

✅ **Hasła**: Hashowanie przez Supabase, silne wymagania

✅ **Sesje**: HTTP-only cookies, auto-refresh, secure w produkcji

✅ **RLS**: Automatyczna ochrona danych na poziomie bazy

✅ **Logowanie**: Błędy bez wrażliwych danych

### 7.4 Następne kroki (poza MVP)

**Przyszłe usprawnienia**:

- OAuth (Google, GitHub) - wymaga konfiguracji w Supabase
- Rate limiting dla endpointów auth - ochrona przed brute force
- Email verification - potwierdzenie e-maila po rejestracji
- 2FA (Two-Factor Authentication) - dodatkowa warstwa bezpieczeństwa
- Session management - lista aktywnych sesji, wylogowanie ze wszystkich urządzeń
- Account settings page - dedykowana strona z ustawieniami konta
- Password strength meter - wizualizacja siły hasła w formularzu
- Remember me - opcja dłuższej sesji

**Monitoring i analytics**:

- Tracking rejestracji i logowań (metryki sukcesu z PRD)
- Error tracking (Sentry, LogRocket)
- Performance monitoring (Astro analytics)

---

**Koniec specyfikacji**
