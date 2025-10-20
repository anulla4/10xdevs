# Tech Stack – Nature Log MVP

## Frontend
- **Astro 5** – statyczne generowanie stron oraz SSR/ISR; minimalny JavaScript w lazy-loaded „wyspach”.
- **React 19** – komponenty interaktywne osadzane w Astro; szeroki ekosystem.
- **TypeScript 5** – statyczne typowanie, lepsze DX i mniejsza liczba błędów runtime.
- **Tailwind CSS 4** – utilitarne klasy do szybkiego stylowania; wsparcie JIT.
- **Leaflet** – renderowanie mapy z OpenStreetMap; łatwa integracja z Reactem.

## Backend-as-a-Service
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
  - Baza danych Postgres z row-level-security.
  - Wbudowane uwierzytelnianie (e-mail/hasło, magic link).
  - REST / Realtime / GraphQL API generowane automatycznie.
  - Open source, możliwość self-hostingu.

## AI / ML (opcjonalnie, poza MVP)
- **Openrouter.ai** – brokera API do wielu modeli (OpenAI, Anthropic, Google); pozwala ustawić limity kosztów i wybrać najtańszy model per request.

## Testing
- **Vitest**: Nowoczesny i szybki framework do testów jednostkowych i integracyjnych, z natywną integracją z Vite.
- **Playwright**: Narzędzie do testów End-to-End (E2E) od Microsoftu, zapewniające niezawodne testowanie w różnych przeglądarkach.

## CI/CD & Hosting
- **GitHub Actions** – pipeline: lint → test → build → docker image → deploy.
- **Docker** – budowanie i pakowanie aplikacji (Astro static + Supabase client).
- **DigitalOcean Droplet / App Platform** – hosting kontenera; HTTPS via Let’s Encrypt, opcjonalny load balancer.

## Rationale
- Szybki time-to-market dzięki gotowym usługom (Supabase) i wydajnemu frontowi (Astro).
- Skalowalność: Supabase repliki + możliwość migracji Postgresa, Astro SSR/edge-rendering.
- Niskie koszty startowe (open-source, darmowe tiery), możliwość późniejszego self-hostingu.
- Bezpieczeństwo: Supabase RLS + JWT, HTTPS na DigitalOcean, statyczny front minimalizuje powierzchnię ataku.
