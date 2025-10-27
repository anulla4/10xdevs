# Struktura UI modułu autentykacji

## Mapa stron

```
/                           → Landing page (WelcomePage)
├── /auth/register          → Formularz rejestracji
├── /auth/login             → Formularz logowania
├── /auth/reset-password    → Formularz reset hasła
├── /auth/update-password   → Formularz nowego hasła
├── /auth/logout            → Wylogowanie (redirect)
└── /panel                  → Panel użytkownika (wymaga auth)
```

## Struktura plików

```
src/
├── components/
│   ├── auth/
│   │   ├── RegisterForm.tsx          ✅ Utworzono
│   │   ├── LoginForm.tsx             ✅ Utworzono
│   │   ├── ResetPasswordForm.tsx     ✅ Utworzono
│   │   ├── UpdatePasswordForm.tsx    ✅ Utworzono
│   │   └── index.ts                  ✅ Utworzono
│   │
│   ├── layout/
│   │   ├── Header.tsx                ✅ Utworzono
│   │   ├── WelcomePage.tsx           ✅ Utworzono
│   │   └── index.ts                  ✅ Utworzono
│   │
│   └── ui/                           ✅ Istniejące (shadcn/ui)
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── ...
│
├── pages/
│   ├── auth/
│   │   ├── register.astro            ✅ Utworzono
│   │   ├── login.astro               ✅ Utworzono
│   │   ├── reset-password.astro      ✅ Utworzono
│   │   ├── update-password.astro     ✅ Utworzono
│   │   └── logout.astro              ✅ Utworzono
│   │
│   ├── index.astro                   ⏳ Do modyfikacji (backend)
│   └── panel.astro                   ⏳ Do modyfikacji (backend)
│
└── layouts/
    └── Layout.astro                  ✅ Zmodyfikowano (Header)
```

## Komponenty UI - Hierarchia

### RegisterForm

```tsx
<div className="w-full max-w-md mx-auto">
  <form>
    {apiError && <div>...</div>}

    <div>
      {' '}
      {/* Email */}
      <Label>E-mail *</Label>
      <Input type="email" />
      {errors.email && <p>...</p>}
    </div>

    <div>
      {' '}
      {/* Password */}
      <Label>Hasło *</Label>
      <Input type="password" />
      {errors.password && <p>...</p>}
    </div>

    <div>
      {' '}
      {/* Confirm Password */}
      <Label>Potwierdź hasło *</Label>
      <Input type="password" />
      {errors.confirmPassword && <p>...</p>}
    </div>

    <Button type="submit">
      {isLoading && <Loader2 />}
      Zarejestruj się
    </Button>

    <div>
      {' '}
      {/* Link to Login */}
      Masz już konto? <a>Zaloguj się</a>
    </div>
  </form>
</div>
```

### LoginForm

```tsx
<div className="w-full max-w-md mx-auto">
  <form>
    {apiError && <div>...</div>}

    <div>
      {' '}
      {/* Email */}
      <Label>E-mail *</Label>
      <Input type="email" />
      {errors.email && <p>...</p>}
    </div>

    <div>
      {' '}
      {/* Password */}
      <Label>Hasło *</Label>
      <Input type="password" />
      {errors.password && <p>...</p>}
    </div>

    <Button type="submit">
      {isLoading && <Loader2 />}
      Zaloguj się
    </Button>

    <div>
      {' '}
      {/* Links */}
      <a>Zapomniałeś hasła?</a>
      Nie masz konta? <a>Zarejestruj się</a>
    </div>
  </form>
</div>
```

### ResetPasswordForm

```tsx
<div className="w-full max-w-md mx-auto">
  {isSuccess ? (
    <div>
      {' '}
      {/* Success message */}
      <CheckCircle2 />
      Link został wysłany...
    </div>
  ) : (
    <form>
      <p>Podaj adres e-mail...</p>

      <div>
        {' '}
        {/* Email */}
        <Label>E-mail *</Label>
        <Input type="email" />
        {error && <p>...</p>}
      </div>

      <Button type="submit">
        {isLoading && <Loader2 />}
        Wyślij link
      </Button>

      <a>Wróć do logowania</a>
    </form>
  )}
</div>
```

### UpdatePasswordForm

```tsx
<div className="w-full max-w-md mx-auto">
  <form>
    <div>
      {' '}
      {/* Info box */}
      Link jest ważny przez 1 godzinę
    </div>

    {apiError && <div>...</div>}

    <div>
      {' '}
      {/* Password */}
      <Label>Nowe hasło *</Label>
      <Input type="password" />
      {errors.password && <p>...</p>}
    </div>

    <div>
      {' '}
      {/* Confirm Password */}
      <Label>Potwierdź hasło *</Label>
      <Input type="password" />
      {errors.confirmPassword && <p>...</p>}
    </div>

    <Button type="submit">
      {isLoading && <Loader2 />}
      Zmień hasło
    </Button>

    <a>Wygeneruj nowy link</a>
  </form>
</div>
```

### Header

```tsx
<header className="sticky top-0 ...">
  <div className="container">
    <div>
      {' '}
      {/* Logo */}
      <a href={isAuthenticated ? '/panel' : '/'}>🌿 Nature Log</a>
    </div>

    <nav>
      {isAuthenticated ? (
        <>
          <div>
            {' '}
            {/* User email */}
            <User /> {user.email}
          </div>
          <Button>Panel</Button>
          <Button>
            <LogOut /> Wyloguj
          </Button>
        </>
      ) : (
        <>
          <Button>Zaloguj się</Button>
          <Button>Zarejestruj się</Button>
        </>
      )}
    </nav>
  </div>
</header>
```

### WelcomePage

```tsx
<div className="min-h-screen bg-gradient-to-br ...">
  {/* Hero Section */}
  <div className="container">
    <div className="text-center">
      <span>🌿</span>
      <h1>Nature Log</h1>
      <p>Twoje obserwacje przyrody...</p>

      <div>
        {' '}
        {/* CTA Buttons */}
        <Button>Rozpocznij za darmo</Button>
        <Button>Zaloguj się</Button>
      </div>
    </div>
  </div>

  {/* Features Section */}
  <div className="container">
    <div className="grid md:grid-cols-2 lg:grid-cols-4">
      <div>
        {' '}
        {/* Feature 1 */}
        <Leaf />
        <h3>Kataloguj obserwacje</h3>
        <p>...</p>
      </div>
      {/* ... 3 more features */}
    </div>
  </div>

  {/* Footer CTA */}
  <div className="container">
    <div className="bg-white rounded-2xl">
      <h2>Gotowy na przygodę?</h2>
      <Button>Utwórz darmowe konto</Button>
    </div>
  </div>
</div>
```

## Strony Astro - Layout

### register.astro / login.astro / reset-password.astro / update-password.astro

```astro
---
import Layout from '../../layouts/Layout.astro';
import { FormComponent } from '../../components/auth/FormComponent';

const redirectTo = Astro.url.searchParams.get('redirectTo') || '/panel';
---

<Layout title="...">
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br ...">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1>Tytuł</h1>
        <p>Opis</p>
      </div>

      <div class="bg-white dark:bg-gray-950 rounded-lg shadow-lg p-8 border">
        <FormComponent client:load redirectTo={redirectTo} />
      </div>
    </div>
  </div>
</Layout>
```

## Przepływ użytkownika

### Rejestracja

```
1. User → /auth/register
2. Wypełnia formularz (email, hasło, potwierdzenie)
3. Klik "Zarejestruj się"
4. POST /api/auth/register (do implementacji)
5. Sukces → redirect do /panel
6. Błąd → wyświetlenie komunikatu
```

### Logowanie

```
1. User → /auth/login
2. Wypełnia formularz (email, hasło)
3. Klik "Zaloguj się"
4. POST /api/auth/login (do implementacji)
5. Sukces → redirect do /panel
6. Błąd → wyświetlenie komunikatu
```

### Reset hasła

```
1. User → /auth/login → "Zapomniałeś hasła?"
2. Redirect → /auth/reset-password
3. Wypełnia formularz (email)
4. Klik "Wyślij link"
5. POST /api/auth/reset-password (do implementacji)
6. Sukces → wyświetlenie komunikatu
7. User otwiera email → klik link
8. Redirect → /auth/update-password?token=...
9. Wypełnia formularz (nowe hasło, potwierdzenie)
10. Klik "Zmień hasło"
11. POST /api/auth/update-password (do implementacji)
12. Sukces → redirect do /auth/login?success=password_changed
```

### Wylogowanie

```
1. User → klik "Wyloguj" w Header
2. Redirect → /auth/logout
3. Server-side: signOut() + clear cookies (do implementacji)
4. Redirect → /auth/login
```

## Walidacja

### Client-side (React)

- **Timing**: onBlur + przed submit
- **Email**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password**: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`
- **Confirm**: `password === confirmPassword`
- **Feedback**: Inline errors (red text pod polem)

### Server-side (do implementacji)

- Wszystkie walidacje powtórzone na backendzie
- Zwracanie odpowiednich HTTP status codes
- Mapowanie błędów na user-friendly messages

## Styling

### Kolory

- **Primary**: Green (nature theme)
- **Background**: Gradient green-blue
- **Cards**: White/dark with shadow
- **Errors**: Destructive (red)
- **Success**: Green

### Spacing

- **Form**: `space-y-4` (16px między sekcjami)
- **Field**: `space-y-2` (8px między label/input/error)
- **Container**: `px-4 md:px-6` (responsive padding)

### Responsywność

- **Mobile**: Single column, hidden elements
- **Tablet**: `sm:` breakpoint (640px)
- **Desktop**: `md:` breakpoint (768px), `lg:` (1024px)

## Ikony (Lucide React)

- **Loader2**: Spinner w przyciskach
- **CheckCircle2**: Sukces w ResetPasswordForm
- **LogOut**: Przycisk wylogowania
- **User**: Ikona użytkownika
- **Leaf**: Feature card (katalog)
- **MapPin**: Feature card (mapa)
- **Camera**: Feature card (opisy)
- **Heart**: Feature card (ulubione)
