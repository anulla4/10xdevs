# Plan Testów dla Aplikacji "Nature Log"

---

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia plan testów dla aplikacji webowej "Nature Log" – platformy przeznaczonej do logowania obserwacji przyrodniczych. Plan ten obejmuje strategię, zakres, zasoby i harmonogram działań testowych, które mają na celu zapewnienie najwyższej jakości produktu końcowego.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

- **Weryfikacja funkcjonalności**: Upewnienie się, że wszystkie funkcje aplikacji działają zgodnie z założeniami i specyfikacją.
- **Zapewnienie bezpieczeństwa**: Identyfikacja i eliminacja potencjalnych luk w zabezpieczeniach, zwłaszcza w modułach uwierzytelniania i autoryzacji.
- **Ocena użyteczności**: Sprawdzenie, czy interfejs użytkownika jest intuicyjny, responsywny i przyjazny dla użytkownika.
- **Weryfikacja wydajności**: Zapewnienie, że aplikacja działa płynnie i responsywnie, nawet pod obciążeniem.
- **Zapewnienie kompatybilności**: Sprawdzenie poprawnego działania aplikacji na różnych przeglądarkach i urządzeniach.

---

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami

- **Moduł uwierzytelniania i autoryzacji**:
  - Rejestracja nowych użytkowników.
  - Logowanie i wylogowywanie.
  - Przypominanie i resetowanie hasła.
  - Ochrona tras wymagających zalogowania.
- **Zarządzanie obserwacjami (CRUD)**:
  - Tworzenie, odczyt, aktualizacja i usuwanie obserwacji.
  - Formularz dodawania obserwacji z walidacją danych.
  - Integracja z mapą (Leaflet) w celu wyboru lokalizacji.
- **Wyświetlanie danych**:
  - Lista obserwacji z paginacją.
  - Filtrowanie i sortowanie listy obserwacji.
  - Wyświetlanie obserwacji na interaktywnej mapie.
- **Profil użytkownika**:
  - Zarządzanie danymi profilowymi.
- **API**:
  - Testowanie wszystkich publicznych endpointów API zdefiniowanych w `openapi.yaml`.
- **Integracja z AI**:
  - Funkcjonalność czatu blokowego i strumieniowego.

### 2.2. Funkcjonalności wyłączone z testów

- Funkcjonalności oznaczone jako "Out of Scope" w pliku `README.md`, takie jak:
  - Uploadowanie zdjęć.
  - Funkcje społecznościowe (komentarze, udostępnianie).
  - Weryfikacja obserwacji przez ekspertów.

---

## 3. Typy Testów

- **Testy jednostkowe**: Weryfikacja poszczególnych komponentów React, funkcji pomocniczych i logiki biznesowej w izolacji.
- **Testy integracyjne**: Sprawdzenie współpracy pomiędzy komponentami front-endowymi a backendem (API Supabase).
- **Testy End-to-End (E2E)**: Symulacja pełnych scenariuszy użytkownika, od logowania po zarządzanie obserwacjami.
- **Testy API**: Bezpośrednie testowanie endpointów API w celu weryfikacji logiki, obsługi błędów i kontraktu danych.
- **Testy wydajnościowe**: Ocena czasu odpowiedzi serwera i renderowania po stronie klienta.
- **Testy bezpieczeństwa**: Weryfikacja odporności na podstawowe ataki (np. XSS, CSRF) i kontrola dostępu.
- **Testy użyteczności i UI**: Ręczna ocena interfejsu pod kątem intuicyjności i zgodności z projektem.
- **Testy kompatybilności**: Sprawdzenie działania aplikacji na najnowszych wersjach popularnych przeglądarek (Chrome, Firefox, Safari, Edge).

---

## 4. Scenariusze Testowe

### 4.1. Uwierzytelnianie

- **Rejestracja**:
  - Poprawna rejestracja z nowymi danymi.
  - Próba rejestracji z zajętym adresem e-mail.
  - Walidacja formularza (nieprawidłowy e-mail, za krótkie hasło).
- **Logowanie**:
  - Poprawne logowanie i przekierowanie do panelu.
  - Próba logowania z błędnym hasłem/e-mailem.
  - Dostęp do chronionych tras bez zalogowania (oczekiwane przekierowanie).
- **Resetowanie hasła**:
  - Poprawne wysłanie linku do resetowania hasła.
  - Zmiana hasła po kliknięciu w link.

### 4.2. Zarządzanie Obserwacjami

- **Tworzenie obserwacji**:
  - Poprawne dodanie nowej obserwacji z wszystkimi wymaganymi polami.
  - Walidacja formularza (brakujące pola, nieprawidłowe dane).
  - Wybór lokalizacji na mapie i zapisanie współrzędnych.
- **Edycja obserwacji**:
  - Poprawna aktualizacja istniejącej obserwacji.
  - Próba edycji obserwacji nienależącej do zalogowanego użytkownika (jeśli dotyczy).
- **Usuwanie obserwacji**:
  - Poprawne usunięcie obserwacji po potwierdzeniu.

### 4.3. Wyświetlanie Danych

- **Lista obserwacji**:
  - Poprawne wyświetlanie i paginacja listy.
  - Działanie filtrów (np. po kategorii, ulubionych).
  - Działanie sortowania (np. po dacie, nazwie).
- **Mapa**:
  - Poprawne wyświetlanie znaczników obserwacji na mapie.
  - Wyświetlanie szczegółów po kliknięciu na znacznik.

---

## 5. Środowisko Testowe

- **Środowisko lokalne**: Do testów jednostkowych i integracyjnych, z wykorzystaniem lokalnej instancji Supabase (jeśli dostępna) lub dedykowanego projektu deweloperskiego.
- **Środowisko stagingowe**: Osobna instancja aplikacji wdrożona na platformie docelowej (np. DigitalOcean), połączona z dedykowaną bazą danych Supabase. Środowisko to będzie używane do testów E2E i akceptacyjnych.
- **Baza danych**: Dedykowana baza testowa Supabase, regularnie czyszczona i wypełniana danymi testowymi (`seed.sql`).

---

## 6. Narzędzia do Testowania

- **Testy jednostkowe i integracyjne**: Vitest lub Jest z React Testing Library.
- **Testy E2E**: Playwright.
- **Testy API**: Postman lub wbudowane narzędzia w frameworku do testów E2E.
- **Testy wydajnościowe**: Lighthouse, WebPageTest.
- **CI/CD**: GitHub Actions do automatycznego uruchamiania testów po każdym pushu do repozytorium.

---

## 7. Harmonogram Testów

Proces testowania będzie prowadzony równolegle z procesem deweloperskim, zgodnie z poniższym harmonogramem:

- **Sprint 1-2**: Implementacja i testowanie modułu uwierzytelniania.
- **Sprint 3-4**: Implementacja i testowanie podstawowych funkcji CRUD dla obserwacji.
- **Sprint 5**: Testowanie zaawansowanych funkcji (filtrowanie, sortowanie, mapa).
- **Sprint 6**: Testy E2E, wydajnościowe i bezpieczeństwa.
- **Faza stabilizacji (1 tydzień)**: Testy regresji i poprawa znalezionych błędów przed wdrożeniem produkcyjnym.

---

## 8. Kryteria Akceptacji

### 8.1. Kryteria wejścia

- Dostępna specyfikacja funkcjonalna.
- Ukończony development danej funkcjonalności.
- Dostępne środowisko testowe.

### 8.2. Kryteria wyjścia

- Ukończone co najmniej 95% zaplanowanych scenariuszy testowych.
- Pokrycie kodu testami jednostkowymi na poziomie co najmniej 80%.
- Brak otwartych błędów krytycznych i blokujących.
- Wszystkie testy w pipeline CI/CD przechodzą pomyślnie.

---

## 9. Role i Odpowiedzialności

- **Inżynier QA**: Odpowiedzialny za tworzenie i realizację planu testów, raportowanie błędów i weryfikację poprawek.
- **Deweloperzy**: Odpowiedzialni za pisanie testów jednostkowych, naprawę zgłoszonych błędów oraz wsparcie w automatyzacji testów.
- **Project Manager**: Nadzór nad harmonogramem i priorytetyzacją zadań testowych.

---

## 10. Procedury Raportowania Błędów

- **Narzędzie**: GitHub Issues.
- **Proces**:
  1. Każdy znaleziony błąd jest zgłaszany jako nowy "Issue".
  2. Zgłoszenie musi zawierać:
     - Tytuł opisujący problem.
     - Szczegółowy opis kroków do reprodukcji błędu.
     - Oczekiwany i rzeczywisty rezultat.
     - Informacje o środowisku (przeglądarka, system operacyjny).
     - Screenshoty lub nagrania wideo (jeśli to możliwe).
     - Priorytet błędu (krytyczny, wysoki, średni, niski).
  3. Deweloper przypisany do błędu analizuje go i wdraża poprawkę.
  4. Po wdrożeniu poprawki na środowisku stagingowym, inżynier QA weryfikuje jej skuteczność i zamyka zgłoszenie.
