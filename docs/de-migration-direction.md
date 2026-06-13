---
name: de-migration-direction
description: "Kierunek projektu — przebudowa backendu w pipeline Data Engineering, pełny plan w docs/MIGRATION_PLAN.md"
metadata:
  node_type: memory
  type: project
  originSessionId: 633ad224-02f1-4ee0-b3ca-6b44d23d638a
---

Użytkownik celuje w **data engineering** (nie frontend) i chce sprofesjonalizować ten projekt jako portfolio DE. Decyzja (2026-06-13): przebudować backend (`scraper.js`) w wieloetapowy pipeline pythonowy (medallion bronze→silver→gold), **frontend zostaje vanilla JS bez zmian**.

**Twardy warunek:** projekt MUSI niezmiennie działać na **GitHub Pages**. Stąd zasada: Pages tylko serwuje statyk (front + gold JSON), cały compute żyje w GitHub Actions (Tier 1–2). Streaming (Tier 3) to jedyna rzecz wymagająca procesu poza GH (VPS/docker) i jest opcjonalna.

**Szew = kontrakt `data/matches.json`** (`meta`/`stats`/`topScorers`/`groups`/`rosters`/`matches[]`). Dopóki gold wypluwa ten kształt, backend można wymienić bez ruszania modułów w `js/`. Patrz [[architecture]].

**Stack docelowy:** Python + DuckDB/Parquet + dbt-duckdb (testy/lineage) + Dagster (assets) + Actions cron. Świadomie BEZ Spark/Kafka/MinIO w batchu — małe dane (104 mecze), to byłby przerost (ten sam błąd, co skasowana fikcyjna pamięć o streamingu).

**Strategia:** strangler — `pipeline/` budowany obok `scraper.js`, candidate JSON + diff w CI, przełączenie po parytecie. Pełny plan fazowy (Tier 1/2/3, checklista, ryzyka): **`docs/MIGRATION_PLAN.md`** w repo.

Status: plan napisany, implementacja NIE rozpoczęta. **WSTRZYMANE (2026-06-13):** priorytet przesunięty na warstwę analityki ([[analytics-roadmap]]), budowaną w obecnym stacku (vanilla JS + Node) BEZ tej przebudowy DE. MIGRATION_PLAN wraca do gry później.
