---
name: free-data-apis
description: Źródła danych Mundialu 2026 — ESPN (faktycznie używane) + alternatywy i ich limity
metadata:
  node_type: memory
  type: reference
  originSessionId: 633ad224-02f1-4ee0-b3ca-6b44d23d638a
---

**FAKTYCZNE źródło dashboardu = ESPN Public API** (`site.api.espn.com/apis/site/v2/sports/soccer/fifa.world`). Bez klucza, bez rejestracji, ma MŚ 2026 z PEŁNYMI danymi za darmo:
- `scoreboard?dates=YYYYMMDD` — lista meczów dnia (status, wynik, venue).
- `summary?event={id}` — szczegóły meczu: `teamStats`, `keyEvents` (gole/kartki z minutą i zawodnikiem), `lineups`, `leaders`.
- Z tego klient liczy strzelców/asysty/tabele/statystyki — patrz [[architecture]].
- ⚠️ PUŁAPKA: ESPN bucketuje po dacie **US-Eastern, nie UTC** (mecz 01:00 UTC = poprzedni dzień ET). Szczegóły w [[architecture]].

**Alternatywy (gdyby ESPN kiedyś padło / nie wystarczyło):**
- **TheSportsDB** — darmowy klucz testowy `3`, FIFA World Cup = liga `id=4429`, `eventsseason.php?id=4429&s=2026`. ✅ wyniki/daty/gole za darmo, ❌ darmowy klucz **kapuje na 15 meczów/sezon**, asysty/kartki/składy = puste. Pełne dane → Premium ~$3/mc. Timeline (`lookuptimeline.php`) ma minuty zdarzeń, ale klucz `3` dławi (429 / zrywane połączenia).
- **football-data.org** — free token, World Cup w darmowym planie, pełne mecze + strzelcy, ale kartki/składy cienkie.
- **API-Football** — na free tylko sezony 2021–2023, 100 req/dobę; pełnia danych płatna.

**Wniosek:** ESPN daje za darmo to, za co inni każą płacić (pełne `keyEvents`/`lineups`/`teamStats` bez limitu i klucza) — dlatego jest źródłem. Reszta to plan B.
