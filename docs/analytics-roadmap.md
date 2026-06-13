---
name: analytics-roadmap
description: "Roadmap warstwy analitycznej dashboardu (xG/ML/predykcje) — etap 0 zrobiony, flagowiec = Elo→Poisson→Monte Carlo"
metadata:
  type: project
---

Kierunek rozbudowy aplikacji o **analitykę/data science** (ustalony 2026-06-13). **Decyzja 2026-06-13:** to jest teraz GŁÓWNY priorytet; przebudowa DE ([[de-migration-direction]] / MIGRATION_PLAN) odłożona na półkę. Analitykę budujemy w **obecnym stacku** (vanilla JS po stronie klienta + ewentualnie Node `scraper.js` w Actions do precompute) — **bez** Pythona/DuckDB/dbt/Dagster i bez czekania na pipeline DE.

Tiery wg wykonalności (ograniczenie: statyczny GitHub Pages, compute tylko w Actions lub w przeglądarce, dane w turnieju za małe na trening — ML musi stać na danych historycznych z zewnątrz):

- **Etap 0 — ZROBIONY:** zakładka „xG i styl gry" z danych, które już są w `matches.json` (zero scrapowania). Nowa nav-tab `data-section="xg"` + sekcja `#xgStats`; obliczenia `matchXG`/`xgVerdict`/`computeTeamXG` są w `js/domain/xg.mjs`, renderowanie w `js/features/xg.mjs`, a style w `styles/xg.css`. **Kluczowy trik:** ESPN nie podaje sumy xG zespołu — odzyskiwane z `expectedGoalsConceded` (xGC) bramkarza PRZECIWNIKA w `details.leaders[].categories[name=saves]`. Edge case: gdy przeciwnik nie oddał celnych strzałów, xGC bywa `null` (np. PAR@USA) → liczby drużynowe liczone per-strona po meczach z dostępnym xG (`xgMF`/`xgMA`/`gfX`/`gaX`), styl gry (posiadanie/podania/obrona) dla wszystkich drużyn.
- **Etap 1 — flagowiec (następny):** Elo/power ratings → model Poissona/Dixon-Coles → **symulacja Monte Carlo turnieju** → „szanse na wyjście z grupy/ćwierćfinał/mistrzostwo". **W obecnym stacku** (nie Python): logikę umieścić jako czysty moduł w `js/domain/` albo precompute w Node `scraper/` → `data/simulation.json`, a osobny moduł `js/features/` tylko renderuje. Reużyć istniejącą logikę grup + 8 najlepszych trzecich miejsc (`js/domain/groups.mjs`, `js/features/groups.mjs`). Dane wejściowe (darmowe): Elo z eloratings.net (seed JSON) lub policzyć Elo z Kaggle „International football results"; ranking FIFA pomocniczo.
- **Etap 2:** ML supervised (LightGBM) na wynik z featurów (Δ Elo, forma, xG, odpoczynek, wartość składu), kalibracja vs kursy.
- **Etap 3 (AI):** LLM-owe recapy/preview meczów po polsku z `keyEvents`+stats (Claude API w kroku Actions → JSON).

Niewykorzystane dane już w pipeline (do przyszłych zakładek): passing (`accuratePasses`/`passPct`/crosses/longBalls), defensywa (tackles/interceptions/clearances/blocks), formacje, per-player stats w `lineups`. Patrz [[architecture]], [[free-data-apis]].
