# Podział modułów

Projekt nadal działa bez frameworka i bez kroku budowania. Granice plików są jednak
ustawione tak, aby logika domenowa nie zależała od DOM ani Firebase.

## Frontend

- `app.js` — stabilny, mały punkt wejścia dla `index.html`.
- `js/app.mjs` — bootstrap, rejestracja akcji i pełne odświeżenie UI.
- `js/core/` — współdzielony stan i formatowanie.
- `js/config/` — konfiguracja usług zewnętrznych.
- `js/domain/` — czyste obliczenia, które można testować i przenieść do innego stacku.
- `js/services/` — Firebase, lokalny fallback i bezpośrednie odświeżanie ESPN.
- `js/features/` — renderowanie pojedynczych obszarów dashboardu i modali.
- `js/ui/` — zachowanie nawigacji i filtrów.

Nowa analityka powinna najpierw trafić do `js/domain/`, a dopiero potem dostać
renderer w `js/features/`. Dzięki temu migracja UI nie wymaga przenoszenia algorytmów.

## Style

`style.css` jest wyłącznie manifestem importów. Pliki w `styles/` są ułożone
w tej samej kolejności co wcześniejszy monolit, więc specyficzność i kaskada
pozostają bez zmian. Nowe style należy dopisywać do pliku odpowiadającego funkcji,
zamiast tworzyć kolejną globalną sekcję.

## Scraper

- `scraper.js` — kompatybilny punkt wejścia dla GitHub Actions.
- `scraper/main.js` — orkiestracja przebiegu.
- `scraper/config.js` — endpointy, ścieżki i stałe turnieju.
- `scraper/lib/` — HTTP, Firebase i daty.
- `scraper/parsers/` — mapowanie odpowiedzi ESPN na kontrakt aplikacji.
- `scraper/domain/` — normalizacja i agregacje gold.
- `scraper/services/` — pobieranie i cache rosterów.
- `scraper/schedule.js` — decyzja, czy pełny scrape jest potrzebny.

Kontraktem między backendem i frontendem pozostaje `data/matches.json`.

## Weryfikacja

`npm test` sprawdza:

- rozwiązywanie importów modułów przeglądarkowych,
- normalizację nazw i tabele grupowe,
- obliczenia xG,
- bucketing dat ESPN w `America/New_York`,
- parsery i agregacje scrapera względem aktualnego gold JSON.
