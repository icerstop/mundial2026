---
name: architecture
description: "Realna architektura dashboardu Mundial — serverless data pipeline (ESPN → Firebase → static frontend), bez streamingu"
metadata:
  node_type: memory
  type: project
  originSessionId: 633ad224-02f1-4ee0-b3ca-6b44d23d638a
---

Dashboard Mundial 2026 to **statyczna strona** (vanilla HTML/CSS/JS, BEZ frameworka i BEZ kroku buildu) hostowana na **GitHub Pages**. Nie ma żadnego serwera ani streamingu — jedyny "serwer" to cron w GitHub Actions. `app.js` i `scraper.js` są małymi, kompatybilnymi punktami wejścia; właściwy kod jest podzielony na `js/`, `styles/` i `scraper/`. Szczegółowe granice modułów opisuje `docs/module-layout.md`. (UWAGA: wcześniejsze notatki o Kafka/Spark/MinIO/Docker były fikcją — nigdy nie istniały w repo, skasowane.)

**Pipeline danych (3 ścieżki, które MUSZĄ mieć ten sam schemat = kontrakt):**
1. **Scraper** (`scraper.js` → `scraper/main.js`, Node) — ciągnie z **ESPN Public API** (`site.api.espn.com/.../fifa.world`: `scoreboard?dates=` + `summary?event=`), składa strukturę, robi REST `PUT` do Firebase na `/worldcup.json` ORAZ commituje `data/matches.json`. Parsery, harmonogram, pobieranie rosterów i agregacje są osobnymi modułami w `scraper/`. Odpalany przez Actions cron (`update-data.yml`). `shouldRunScrape()` jest schedule-driven z godzin meczów (okno [kickoff−10min, +165min] + catch-up + daily fallback) — pełny skan dni 11.06–20.07.
2. **Firebase Realtime DB** (`mundial2026-8b652`, europe-west1, ścieżka `/worldcup.json`) — kanał push WebSocket do przeglądarek (compat SDK 10.8.0 w index.html).
3. **Klient** (`app.js` → `js/app.mjs`) — ładuje z Firebase (live) z fallbackiem na `data/matches.json`; NIEZALEŻNIE odświeża wyniki z ESPN co 30 s (`js/services/live-scores.mjs`). Widoki są rozdzielone w `js/features/`, a logika możliwa do ponownego użycia i testowania mieszka w `js/domain/`.

Schemat kontraktu: `meta` + `stats` + `topScorers`/`topAssisters`/`topCanadian` + `groups` + `rosters` + `matches[]` (każdy: status, venue, home/away ze score, `details{teamStats,keyEvents,lineups,...}`). Statystyki/tabele/dzień są liczone PO STRONIE KLIENTA z `matches[]` (`js/features/hero.mjs`, `js/domain/groups.mjs`) — nie ufamy precomputed.

**Krytyczna pułapka (gotcha):** ESPN bucketuje mecze po dacie **US-Eastern (America/New_York), NIE UTC**. Mecz o 01:00 UTC należy do POPRZEDNIEGO dnia ET. Dlatego scraper skanuje cały zakres dni, a klient `espnDateStr` używa `America/New_York`. To był root cause "znikających" wyników nocnych meczów.

**Live override:** `liveScoreCache` (Map) + `applyLiveOverride()` zachowują świeże dane ESPN po nadpisaniu przez Firebase push.

Powiązane: [[design-palette]], [[free-data-apis]].
