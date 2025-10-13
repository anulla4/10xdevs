# Dokument wymagań produktu (PRD) - Nature Log
## 1. Przegląd produktu
Nature Log to webowa aplikacja dla miłośników przyrody, umożliwiająca łatwe rejestrowanie i przeglądanie obserwacji roślin, zwierząt oraz miejsc. MVP koncentruje się na minimalnym, ale kompletnym cyklu: rejestracja użytkownika, dodanie obserwacji z lokalizacją, zarządzanie wpisami i wizualizacja na mapie.

Cele biznesowe:
- Walidacja zapotrzebowania na lekkie narzędzie do logowania obserwacji przyrodniczych.
- Zbudowanie bazy pierwszych użytkowników i zebranie feedbacku.
- Demonstracja wykonalności rozwiązania opartego na OpenStreetMap i Leaflet.js.

## 2. Problem użytkownika
Enthuzjaści przyrody nie mają prostego, darmowego narzędzia do uporządkowanego zapisywania obserwacji wraz z kontekstem lokalizacyjnym. Notatki lub zdjęcia bez wskazania miejsca i daty są mało użyteczne i trudne do przeszukiwania.

## 3. Wymagania funkcjonalne
1. Uwierzytelnianie: rejestracja (e-mail, hasło), logowanie, reset hasła (link ważny 1 h), usunięcie konta (potwierdzenie hasłem).
2. Zarządzanie obserwacjami:
   - Dodawanie poprzez kliknięcie na mapie + formularz (nazwa, opis 0–500 znaków, data, lokalizacja).
   - Edycja i usuwanie własnych wpisów.
   - Lista z paginacją (20), wyszukiwaniem tekstowym i sortowaniem (data domyślnie, alfabetyczne).
3. Mapa (Leaflet.js, OSM):
   - Pinezki wszystkich obserwacji użytkownika.
   - Domyślnie wyśrodkowana na Polskę.
   - Tooltip po kliknięciu pinezki z nazwą, datą i linkiem do szczegółów.
4. Widok szczegółów obserwacji: nazwa, pełny opis, data, statyczna mini-mapa.
5. Layout: desktop – dwie kolumny (lista | mapa); mobile – zakładki Lista/Mapa.
6. UI/UX: Bootstrap lub TailwindCSS, kolorystyka natury; modal potwierdzający operacje destrukcyjne; spinnery podczas ładowania; podświetlenie nowo dodanego/edytowanego wpisu.
7. Dostępność: kontrast WCAG AA, obsługa klawiatury, aria-label dla elementów.
8. Stopka: linki do Polityki Prywatności i Regulaminu.

## 4. Granice produktu
- Brak zdjęć i multimediów w obserwacjach.
- Brak GPS-trackingu i geolokalizacji w czasie rzeczywistym.
- Brak funkcji społecznościowych, gamifikacji, AI, trybu offline, aplikacji natywnej.
- Klastrowanie pinezek planowane po MVP.

## 5. Historyjki użytkowników
| ID | Tytuł | Opis | Kryteria akceptacji |
|----|-------|------|---------------------|
| US-001 | Rejestracja konta | Jako nowy użytkownik chcę utworzyć konto podając e-mail i hasło, aby móc zapisywać obserwacje. | 1. Formularz z polami e-mail i hasło. 2. Przy istniejącym e-mailu komunikat o błędzie. 3. Po sukcesie automatyczne logowanie i przekierowanie do /panel. |
| US-002 | Logowanie | Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich danych. | 1. Formularz e-mail/hasło. 2. Nieprawidłowe dane zwracają komunikat „Nieprawidłowy e-mail lub hasło”. 3. Po sukcesie widok panelu. |
| US-003 | Reset hasła | Jako użytkownik, który zapomniał hasła, chcę otrzymać link resetujący ważny 1 h, aby ustawić nowe hasło. | 1. Formularz przyjmuje e-mail. 2. System wysyła link. 3. Link prowadzi do formularza zmiany hasła. 4. Po zmianie hasła można się zalogować nowym hasłem. |
| US-004 | Usunięcie konta | Jako użytkownik chcę usunąć konto wraz z danymi, aby zrezygnować z usługi. | 1. Opcja w ustawieniach. 2. Wymaga ponownego wpisania hasła i potwierdzenia w modalnym oknie. 3. Po usunięciu następuje wylogowanie. |
| US-005 | Dodanie obserwacji | Jako użytkownik chcę kliknąć na mapie i dodać obserwację przez formularz, aby zapisać znalezisko. | 1. Kliknięcie na mapie otwiera formularz z wypełnionymi współrzędnymi. 2. Wymagane pola walidowane. 3. Po zapisie obserwacja pojawia się na liście i mapie; element podświetlony przez 3 s. |
| US-006 | Przeglądanie listy | Jako użytkownik chcę widzieć listę obserwacji z nazwą, datą i miejscowością, aby szybko je przeglądać. | 1. Lista ładuje maks. 20 wpisów. 2. Dostępne sortowanie i wyszukiwanie. 3. Kliknięcie elementu centruje mapę na danej pinezce. |
| US-007 | Przeglądanie mapy | Jako użytkownik chcę zobaczyć wszystkie moje obserwacje jako pinezki, aby mieć wizualny przegląd. | 1. Mapa wczytuje pinezki dla zalogowanego użytkownika. 2. Kliknięcie pinezki pokazuje tooltip z nazwą, datą, linkiem. |
| US-008 | Edycja obserwacji | Jako użytkownik chcę edytować wpis, aby poprawić błędy. | 1. Formularz edycji z wstępnie wypełnionymi danymi. 2. Walidacja identyczna jak przy dodawaniu. 3. Po zapisie wpis aktualizuje się na liście i mapie. |
| US-009 | Usunięcie obserwacji | Jako użytkownik chcę usunąć wpis, który nie jest już potrzebny. | 1. Przyciski Usuń przy każdym wpisie. 2. Modal z pytaniem „Czy na pewno chcesz usunąć…”. 3. Po potwierdzeniu wpis znika z listy i mapy. |
| US-010 | Wyszukiwanie i sortowanie | Jako użytkownik chcę filtrować listę po tekście i sortować ją, aby łatwo znaleźć wpis. | 1. Pole wyszukiwania filtruje po nazwie i opisie. 2. Sortowanie: data (najnowsze → najstarsze) i nazwa (A→Z). |
| US-011 | Dostępność | Jako użytkownik z ograniczeniami ruchowymi chcę nawigować aplikację klawiaturą. | 1. Tab-order obejmuje wszystkie interaktywne elementy. 2. Każdy przycisk ma aria-label. 3. Kontrast kolorów spełnia WCAG AA. |

## 6. Metryki sukcesu
1. Tygodniowa liczba nowych rejestracji użytkowników.
2. Retencja po 7 dniach (użytkownicy powracający / użytkownicy zarejestrowani 7 dni wcześniej).
3. Średnia liczba obserwacji przypadających na aktywnego użytkownika w tygodniu.
4. Wynik testu E2E potwierdzający ścieżkę: rejestracja → dodanie obserwacji → wyświetlenie jej na liście i mapie (musi osiągnąć 100 %).
