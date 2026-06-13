const fs = require('fs');
const { OUT_FILE } = require('./config');

// Decide whether to run a full scrape — driven by our OWN fixture list.
// We already know every kickoff time, so we can work only around matches and rest
// otherwise, with no dependency on ESPN's date bucketing (which is US-Eastern, not UTC —
// a 01:00 UTC match lands in the *previous* ET day, which broke the old "today" check).
async function shouldRunScrape() {
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  if (force) {
    console.log('⚡ Flaga --force — pełny scrape.');
    return true;
  }

  if (!fs.existsSync(OUT_FILE)) {
    console.log('⚡ Brak matches.json — pierwszy scrape.');
    return true;
  }

  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
  } catch (e) {
    console.warn('⚠️  Nie udało się sparsować matches.json — pełny scrape.');
    return true;
  }

  const matches = existing.matches || [];
  if (matches.length === 0) {
    console.log('⚡ Brak meczów w danych — pełny scrape.');
    return true;
  }

  const now = Date.now();
  const PRE_MS     = 10 * 60 * 1000;      // zacznij chwilę przed gwizdkiem
  const LIVE_MS    = 165 * 60 * 1000;     // 90' + przerwa + doliczony + ew. dogrywka + bufor
  const CATCHUP_MS = 18 * 60 * 60 * 1000; // dogoń wynik meczu, którego nie zdążyliśmy zapisać

  for (const m of matches) {
    const k = new Date(m.date).getTime();
    if (isNaN(k)) continue;
    const since = now - k;

    // Mecz w oknie: za chwilę start / trwa / dopiero co się skończył
    if (since >= -PRE_MS && since <= LIVE_MS) {
      console.log(`🔥 ${m.shortName || m.name} w oknie meczowym — scraping.`);
      return true;
    }
    // Mecz powinien być już zakończony, a nie mamy jego wyniku — dogoń (do 18h po gwizdku)
    if (!m.status?.completed && since > LIVE_MS && since <= CATCHUP_MS) {
      console.log(`🏁 ${m.shortName || m.name} zakończony, brak wyniku w danych — scraping.`);
      return true;
    }
  }

  // Fallback dzienny: odśwież terminarz/tabele, jeśli dane są starsze niż 12h
  const lastUpdated = existing.meta?.lastUpdated ? new Date(existing.meta.lastUpdated).getTime() : 0;
  if (now - lastUpdated >= 12 * 60 * 60 * 1000) {
    console.log('⚡ Dane starsze niż 12h — odświeżam (terminarz/tabele).');
    return true;
  }

  console.log('💤 Brak meczów w oknie i wszystkie wyniki zapisane — śpię.');
  return false;
}


module.exports = { shouldRunScrape };
