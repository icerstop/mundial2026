# Plan migracji: dashboard → projekt Data Engineering

> **Cel:** przebudować backend (`scraper.js`) w prawdziwy, wieloetapowy pipeline danych
> (medallion: bronze → silver → gold) z hurtownią, orkiestracją i testami jakości —
> **bez ruszania frontendu i bez utraty kompatybilności z GitHub Pages.**

---

## 0. Zasada przewodnia (czytaj najpierw)

Trzy reguły, które trzymają cały plan w ryzach:

1. **Kontrakt = szew.** Frontend (`app.js` → moduły w `js/`) czyta wyłącznie kształt `data/matches.json`
   (`meta` + `stats` + `topScorers`/`topAssisters`/`topCanadian` + `groups` + `rosters` + `matches[]`).
   Dopóki warstwa **gold** wypluwa ten sam kształt, backend można przebudować w całości,
   a front się nie zmienia. **Ten plik to jedyny interfejs między światami.**
2. **Pages tylko serwuje.** GitHub Pages podaje statyczne pliki (front + gold JSON). Nie liczy.
   Cały compute żyje w **GitHub Actions** (Tier 1–2) lub na zewnętrznym procesie (tylko Tier 3 streaming).
   To już dziś tak działa — zmieniamy tylko *zawartość* kroku w Actions, nie jego rolę.
3. **To są małe dane (104 mecze).** Historia DE = rygor i trafione trade-offy, nie skala.
   Świadomie **nie** używamy Spark/Kafka/MinIO w batchu — to byłby teatr. DuckDB + Parquet w zupełności wystarczą.

---

## 1. Stan obecny → mapowanie na etapy

Cała logika w `scraper/` już istnieje — migracja ją **przenosi do nowego pipeline**, nie wymyśla od nowa.

| Obecny kod (`scraper/`)                           | Rola dziś                       | Etap docelowy            |
|---------------------------------------------------|---------------------------------|--------------------------|
| `fetchJSON`, `sleep`, skan dni 11.06–20.07 (ET)   | pobranie scoreboard/summary     | **extract → bronze**     |
| `parseScoreboardEvent`                            | parsowanie meczu z listy        | **silver** (transform)   |
| `parseSummary`                                    | szczegóły meczu (statystyki/zdarzenia/składy) | **silver**  |
| `parseStandings`                                  | tabele grup                     | **silver**               |
| `normalizeTeamName`, `COACH_OVERRIDES`            | normalizacja / nadpisania       | **seeds + silver**       |
| agregacje (`stats`, `topScorers`, `topCanadian`…) | liczenie podsumowań             | **gold** (modele)        |
| `pushToFirebase`, zapis `data/matches.json`       | publikacja kontraktu            | **load / serve**         |
| `shouldRunScrape` (schedule-driven, okno meczu)   | bramka uruchomienia             | **orkiestracja**         |

**Pułapka do zachowania:** ESPN bucketuje mecze po dacie **US-Eastern, nie UTC** (mecz 01:00 UTC = poprzedni
dzień ET). Skan całego zakresu dni i logika dat MUSZĄ to przenieść 1:1 — to był kosztowny bug, nie wolno go zgubić.

---

## 2. Stack docelowy

| Warstwa            | Narzędzie                  | Dlaczego                                                            |
|--------------------|----------------------------|--------------------------------------------------------------------|
| Język              | **Python 3.12**            | DE jest Python-first; Node czyta się jako „web dev"                |
| Storage / silnik   | **DuckDB + Parquet**       | małe dane, SQL, zero infrastruktury, „hot" w DE                    |
| Transformacje      | **dbt-duckdb** (Tier 2)    | testy + lineage + docs — najbardziej marketowalny element          |
| Orkiestracja       | **Dagster** (Tier 2)       | model „assets" = medallion 1:1, świetne UI na screeny do portfolio |
| Scheduler / compute| **GitHub Actions** (cron)  | darmowy, już działa, pełna maszyna Linux                           |
| Serving live       | **Firebase RTDB**          | zostaje — push do przeglądarek                                     |
| Serving statyczne  | **GitHub Pages**           | zostaje — serwuje front + gold JSON                                |
| Streaming (Tier 3) | **Redpanda + Bytewax**     | tylko jeśli robimy live events; wymaga procesu ciągłego (poza GH)  |

---

## 3. Architektura docelowa

```
                    ┌──────────────── GitHub Actions (cron co ~10 min) ─────────────────┐
                    │                                                                    │
  ESPN Public API ──┼─► EXTRACT ──► BRONZE ──► SILVER (dbt) ──► GOLD (dbt) ──► PUBLISH ──┼─► data/matches.json (commit)
  (scoreboard,      │   espn_client  surowe     czyszczenie/      agregacje/    gold→JSON │                │
   summary,         │   .py          JSON/      normalizacja      modele        + Firebase│                ▼
   standings,       │                Parquet    (fact_*/dim_*)    (kontrakt)    push      │      ┌──────────────────┐
   rosters)         │                           w DuckDB                                  │      │  GitHub Pages    │
                    └────────────────────────────────────────────────────────────────────┘      │  (statyczny front│
                                                                                                   │  + gold JSON)    │
  Firebase RTDB ◄──────────────────────── push (live) ──────────────────────────────────────────►│  app.js czyta    │
                                                                                                   └──────────────────┘
```

**Kluczowe:** wszystko po lewej od `data/matches.json` to compute w Actions.
Pages dotyka tylko prawej strony (statyk). Nic w tej granicy się nie zmienia.

---

## 4. Struktura katalogów (docelowa)

```
mundial_dashboard/
├── index.html, app.js, style.css          # stabilne punkty wejścia frontu
├── js/, styles/                           # moduły frontu — NIETKNIĘTE przez migrację DE
├── data/matches.json                       # GOLD output — NIEZMIENNY KONTRAKT
├── pipeline/                               # ← cały nowy backend DE
│   ├── pyproject.toml                       # zależności (duckdb, dbt-duckdb, dagster, httpx)
│   ├── extract/
│   │   ├── espn_client.py                   # fetchJSON + rate-limit + skan dni ET (z scraper.js)
│   │   └── ingest.py                        # zapis surowych odpowiedzi → bronze/
│   ├── bronze/                              # surowe JSON/Parquet ESPN, partycjonowane po dacie pobrania
│   ├── warehouse.duckdb                     # hurtownia: tabele silver + gold
│   ├── dbt/                                 # Tier 2
│   │   ├── dbt_project.yml
│   │   ├── models/silver/{matches,events,team_stats,standings,players}.sql
│   │   ├── models/gold/{contract,stats,top_scorers,groups}.sql
│   │   └── models/schema.yml                # testy: unique/not_null/relationships
│   ├── load/
│   │   └── publish.py                       # gold → data/matches.json + push Firebase
│   ├── seeds/
│   │   └── coach_overrides.csv              # COACH_OVERRIDES + mapowanie nazw drużyn
│   └── dagster/                             # Tier 2: assets + schedule
│       └── definitions.py
├── .github/workflows/update-data.yml       # rozszerzony: setup-python → pipeline → commit gold
└── docs/
```

Obecny backend Node (`scraper.js` + `scraper/`) zostaje do czasu osiągnięcia parytetu (patrz §8), potem jest usuwany.

---

## 5. Fazy migracji

### Tier 1 — porządny batch (~2–3 dni) · 100% darmowe, Pages bez zmian

**Cel:** rozdzielić extract / transform / serve, postawić medallion na DuckDB, gold = identyczny `matches.json`.

1. **Setup.** `pipeline/` + `pyproject.toml` (duckdb, httpx, pydantic). Środowisko lokalne + `setup-python` w Actions.
2. **Extract → bronze.** Przenieś `fetchJSON`/rate-limit/skan dni ET do `espn_client.py`.
   `ingest.py` zapisuje **surowe** odpowiedzi (scoreboard per dzień, summary per event, standings, rosters)
   do `bronze/` jako JSON/Parquet, partycjonowane po dacie pobrania. **Retencja surowych danych = fundament DE.**
3. **Silver (na razie SQL w DuckDB, bez dbt).** Porty `parseScoreboardEvent`/`parseSummary`/`parseStandings`
   na zapytania ładujące bronze → znormalizowane tabele: `matches`, `events`, `team_stats`, `standings`, `players`.
   Idempotentnie, klucze: `match_id`, `event_id`.
4. **Gold.** Zapytania agregujące (stats, topScorers/Assisters/Canadian, groups) → tabele gold,
   serializowane do **dokładnie** kształtu kontraktu.
5. **Publish.** `publish.py`: gold → `data/matches.json` (+ `pushToFirebase`).
6. **Orkiestracja.** Logika `shouldRunScrape` → bramka w Pythonie; workflow Actions: `setup-python → pipeline → commit gold`.

**Deliverable:** `python -m pipeline` produkuje bajt-w-bajt zgodny `matches.json`. Bronze retencjonowany. Wszystko w Actions.

### Tier 2 — rygor i modelowanie (~+tydzień) · nadal darmowe, Pages bez zmian

7. **dbt-duckdb.** Przenieś silver/gold z surowego SQL do modeli dbt. Dodaj `schema.yml` z **testami**
   (`unique` na `match_id`, `not_null` na datach, `accepted_range` score ≥ 0, `relationships` events→matches).
   Dostajesz **lineage + auto-docs** (`dbt docs`) — mocny element portfolio.
8. **Model wymiarowy.** `fact_matches`, `fact_events`, `dim_team`, `dim_player`, `dim_venue` (star schema = klasyczny sygnał DE).
9. **Historia / snapshoty.** Trzymaj migawki stanu (np. `dbt snapshot` lub append do bronze z timestampem),
   żeby „statystyki dzień-po-dniu" liczyć w hurtowni, nie po stronie klienta.
10. **Dagster.** Owiń etapy w **assets** (bronze→silver→gold mapuje się 1:1), dodaj schedule.
    UI Dagstera = świetne screeny do README/portfolio.
11. **CI.** Testy dbt + lint (ruff) odpalane w Actions na każdym pushu i przed publikacją gold.

**Deliverable:** medallion z testami, lineage, modelem wymiarowym, orkiestracją Dagster. Pełnoprawny projekt DE.

### Tier 3 — streaming live'owych zdarzeń (~+1–2 tyg) · OPCJONALNE, wymaga compute poza GitHubem

> Jedyne miejsce z **prawdziwym** uzasadnieniem streamingu: gole/kartki minuta-po-minucie podczas meczu.
> Uzasadnienie = **latencja i semantyka event-time**, NIE wolumen.

12. **Źródło zdarzeń.** Podczas meczu producer poolujący ESPN `keyEvents` → topic Redpanda `wc.events`.
13. **Processor.** Bytewax/Faust (Python) lub Spark Structured Streaming: agregacja event-time,
    **dedup po `event_id`**, **watermarki na spóźnione/poza-kolejnością zdarzenia**.
14. **Wyjście.** Processor pisze do **gold/Firebase** (nie renderuje po stronie serwera) → front czyta jak dziś.
15. **Dokumentacja trade-offu.** W README: *„streaming wymaga procesu ciągłego (VPS / docker-compose lokalnie w trybie demo);
    w prawdziwym systemie o tym wolumenie wybrałbym micro-batch — oto dlaczego."* Ta samoświadomość to sygnał seniora.

**Haczyk infra:** Actions to joby ograniczone czasowo (cron min. co 5 min, job ≤ 6h) — to nie jest stały runtime.
Streaming = mały VPS albo docker lokalnie (tryb demo offline odtwarzający zdarzenia z bronze). **Powierzchnia dla
przeglądarki zostaje statyczna** → Pages dalej bez zmian.

---

## 6. Kontrakt gold (NIEZMIENNY — to musi przeżyć migrację 1:1)

Warstwa gold serializuje DOKŁADNIE ten kształt (to czytają moduły frontendu w `js/`):

```jsonc
{
  "meta":   { "lastUpdated": "...", "source": "ESPN Public API", ... },
  "stats":  { "matchesPlayed": 0, "totalGoals": 0, "avgGoalsPerMatch": 0.0, ... },
  "topScorers": [ ... ], "topAssisters": [ ... ], "topCanadian": [ ... ],
  "groups": [ { "name": "A", "standings": [ ... ] }, ... ],
  "rosters": { "<norm-team>": { "coach": "...", "players": [ ... ] } },
  "matches": [ {
    "id", "date", "shortName", "status": { "state","detail","completed","clock","period" },
    "venue", "attendance",
    "home": { "id","name","abbr","logo","score","winner" }, "away": { ... },
    "group",
    "details": { "teamStats", "lineups", "keyEvents", "commentary", "gameInfo", "leaders" }
  } ]
}
```

**Test akceptacyjny migracji:** dla tego samego snapshotu bronze, nowy gold == stary `matches.json`
(diff strukturalny = pusty). Dopóki to nie przejdzie — `scraper.js` zostaje jako źródło prawdy.

---

## 7. Co się NIE zmienia

- `index.html`, `app.js`, `style.css`, `js/`, `styles/` — **zero zmian** w ramach migracji DE.
- Kształt `data/matches.json` — **niezmienny** (tylko zmienia się *kto* go produkuje).
- Firebase RTDB jako relay live + `pushToFirebase` (logikę przenosimy do `publish.py`, zachowanie to samo).
- GitHub Pages: serwuje front + gold JSON, dokładnie jak dziś.
- Cron w Actions (interwał, schedule-driven gate).

---

## 8. Strategia bezpieczna (strangler) i rollback

1. Buduj `pipeline/` **obok** `scraper.js` — stary skrypt nadal produkuje gold (źródło prawdy).
2. Workflow puszcza nowy pipeline do **tymczasowego** `data/_matches.candidate.json`, NIE nadpisując produkcji.
3. Krok CI robi **diff** `candidate` vs `matches.json` (produkcyjny ze `scraper.js`). Cel: diff pusty / tylko oczekiwane różnice.
4. Po serii zielonych diffów (kilka dni meczowych) — przełącz workflow: pipeline pisze produkcyjny gold, `scraper.js` wyłączony.
5. Po okresie stabilizacji — usuń `scraper.js`.

**Rollback:** dopóki `scraper.js` istnieje, wystarczy przywrócić jego krok w workflow. Front i kontrakt nigdy nie były ruszane, więc ryzyko regresji UI = zero.

---

## 9. Kolejność prac (checklista)

- [ ] **T1.1** `pipeline/` + `pyproject.toml`, `setup-python` w workflow
- [ ] **T1.2** `espn_client.py` (przeniesiony fetch + rate-limit + skan dni ET)
- [ ] **T1.3** `ingest.py` → bronze (surowe, partycjonowane)
- [ ] **T1.4** silver: porty `parseScoreboardEvent/parseSummary/parseStandings` (SQL DuckDB)
- [ ] **T1.5** gold: agregacje → kształt kontraktu
- [ ] **T1.6** `publish.py` (gold → JSON + Firebase)
- [ ] **T1.7** bramka orkiestracji (`shouldRunScrape`)
- [ ] **T1.8** strangler: candidate JSON + diff w CI (§8)
- [ ] **T2.1** dbt-duckdb: silver/gold jako modele + `schema.yml` testy
- [ ] **T2.2** model wymiarowy (fact_*/dim_*)
- [ ] **T2.3** snapshoty historyczne (dzień-po-dniu w hurtowni)
- [ ] **T2.4** Dagster assets + schedule
- [ ] **T2.5** CI: testy dbt + ruff
- [ ] **T2.6** README (EN) + screeny lineage/Dagster
- [ ] **T3.x** (opcjonalnie) streaming live events — patrz §5 Tier 3

---

## 10. Ryzyka

| Ryzyko                                            | Mitygacja                                                            |
|---------------------------------------------------|---------------------------------------------------------------------|
| Rozjazd gold vs stary kontrakt (regresja UI)      | strangler + diff w CI (§8); `scraper.js` jako źródło prawdy do parytetu |
| Zgubienie pułapki ET-bucketing                    | przeniesienie skanu dni 1:1; test na meczu nocnym (np. PAR@USA 01:00Z) |
| Bronze puchnie w repo                             | Parquet + retencja; ewentualnie artefakty Actions zamiast commitu   |
| Tier 3 wymaga infra poza GH                       | traktuj jako opcjonalny badge; tryb demo offline z bronze           |
| Przerost narzędzi (Spark/Kafka na małych danych)  | świadomie odrzucone; udokumentowany trade-off = plus w portfolio    |

---

*Powiązane: `docs/architecture.md` (realny stan obecny), `docs/free-data-apis.md` (źródło ESPN).*
*Plan zakłada Python-first backend; frontend pozostaje vanilla JS na GitHub Pages.*
