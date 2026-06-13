---
name: design-palette
description: Stała paleta i czcionki dla grafik/dashboardów Mundialu (marka @jakub_bilski)
metadata:
  node_type: memory
  type: project
  originSessionId: 633ad224-02f1-4ee0-b3ca-6b44d23d638a
---

Projekty wizualizacji danych Mundialu 2026 tworzy **@jakub_bilski** (X: @jakub_bilski, IG: @jakub__bilski) jako content na social media — stąd ważny jest spójny, rozpoznawalny design i eksport do grafik.

Stała paleta: tło `#0d0d0d`, grid `#222222`, tekst `#e8e8e8`, muted `#7a7a7a`, żółty akcent `#f5c518`, ciemny żółty `#8a6f0e`.
Czcionka: **Parkinsans** (WSZĘDZIE, jeden font — wcześniejsze IBM Plex Mono/Outfit/Space Grotesk już NIE obowiązują). Cały interfejs **wielkimi literami** — `body { text-transform: uppercase }` + jawna reguła dla `button, input, select, textarea` (kontrolki nie dziedziczą).

**Jak stosować:** każdy nowy dashboard/grafikę utrzymuj w tej palecie, w Parkinsans i caps locku, z podpisem autora w stopce. Dashboard webowy (vanilla JS, GitHub Pages) liczy statystyki z `data/matches.json` — szczegóły w [[architecture]].
