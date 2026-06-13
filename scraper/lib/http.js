const https = require('https');
const { FIREBASE_DB_SECRET, FIREBASE_DB_URL } = require('../config');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Mundial Dashboard Agent)' } }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function pushToFirebase(data) {
  if (!FIREBASE_DB_URL) {
    console.log('ℹ️ Firebase: URL bazy danych nie jest skonfigurowany. Pomijam wypychanie chmurowe.');
    return Promise.resolve();
  }

  // Parse database URL
  let cleanUrl = FIREBASE_DB_URL.trim();
  if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

  const targetUrl = `${cleanUrl}/worldcup.json` + (FIREBASE_DB_SECRET ? `?auth=${FIREBASE_DB_SECRET}` : '');
  console.log(`📡 Firebase: Wypychanie danych na adres: ${cleanUrl}/worldcup.json ...`);

  const urlObj = new URL(targetUrl);
  const payload = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('🔥 Firebase: Dane zostały pomyślnie zsynchronizowane w czasie rzeczywistym!');
          resolve();
        } else {
          reject(new Error(`Firebase REST API zwróciło status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}


module.exports = { fetchJSON, pushToFirebase, sleep };
