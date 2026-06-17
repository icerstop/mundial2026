// One-off backfill: adds match.details.xg (xG/npxG/xGOT/xA/xGA) to every
// completed match in data/matches.json using the ESPN core API. Idempotent —
// safe to re-run. Future scraper runs populate this automatically.
const fs = require('fs');
const { OUT_FILE } = require('../scraper/config');
const { enrichMatchXG } = require('../scraper/services/match-xg');

async function main() {
  const data = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const targets = data.matches.filter(m => m.status?.completed && m.details);
  console.log(`Backfilling xG for ${targets.length} completed matches...`);

  let ok = 0;
  for (const match of targets) {
    const done = await enrichMatchXG(match);
    const xg = match.details.xg;
    console.log(
      `  ${done ? 'OK ' : '-- '} ${match.home.abbr} ${match.home.score}-${match.away.score} ${match.away.abbr}` +
      (done ? `  xG ${xg.home?.xg ?? '?'} : ${xg.away?.xg ?? '?'}` : '  (no data)')
    );
    if (done) ok++;
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Done. ${ok}/${targets.length} matches enriched. Saved to ${OUT_FILE}`);
}

main().catch(e => { console.error('Fatal:', e); process.exitCode = 1; });
