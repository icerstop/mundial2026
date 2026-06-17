
const path = require('path');

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
// Core API exposes advanced per-team stats (xG, npxG, xGOT, xA, xGA) that the
// public summary endpoint only surfaces indirectly via the goalkeeper leader.
const CORE = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const OUT_FILE = path.join(DATA_DIR, 'matches.json');
const FIREBASE_DB_URL = 'https://mundial2026-8b652-default-rtdb.europe-west1.firebasedatabase.app';
const FIREBASE_DB_SECRET = '';
const TOURNAMENT_START = new Date('2026-06-11');
const TOURNAMENT_END = new Date('2026-07-20');

const COACH_OVERRIDES = {
  'algeria': 'Vladimir Petković',
  'argentina': 'Lionel Scaloni',
  'australia': 'Tony Popovic',
  'austria': 'Ralf Rangnick',
  'belgium': 'Domenico Tedesco',
  'bosnia and herzegovina': 'Sergej Barbarez',
  'brazil': 'Dorival Júnior',
  'canada': 'Jesse Marsch',
  'cabo verde': 'Bubista',
  'colombia': 'Néstor Lorenzo',
  'dr congo': 'Sébastien Desabre',
  'croatia': 'Zlatko Dalić',
  'curacao': 'Dick Advocaat',
  'czechia': 'Ivan Hašek',
  'ecuador': 'Sebastián Beccacece',
  'egypt': 'Hossam Hassan',
  'england': 'Thomas Tuchel',
  'france': 'Didier Deschamps',
  'germany': 'Julian Nagelsmann',
  'ghana': 'Otto Addo',
  'haiti': 'Sébastien Migné',
  'iran': 'Amir Ghalenoei',
  'iraq': 'Jesús Casas',
  'cote d\'ivoire': 'Emerse Faé',
  'japan': 'Hajime Moriyasu',
  'jordan': 'Jamal Sellami',
  'mexico': 'Javier Aguirre',
  'morocco': 'Walid Regragui',
  'netherlands': 'Ronald Koeman',
  'new zealand': 'Darren Bazeley',
  'norway': 'Ståle Solbakken',
  'panama': 'Thomas Christiansen',
  'paraguay': 'Gustavo Alfaro',
  'portugal': 'Roberto Martínez',
  'qatar': 'Tintín Márquez',
  'saudi arabia': 'Hervé Renard',
  'scotland': 'Steve Clarke',
  'senegal': 'Pape Thiaw',
  'south africa': 'Hugo Broos',
  'south korea': 'Hong Myung-bo',
  'spain': 'Luis de la Fuente',
  'sweden': 'Jon Dahl Tomasson',
  'switzerland': 'Murat Yakin',
  'tunisia': 'Sabri Lamouchi',
  'türkiye': 'Vincenzo Montella',
  'united states': 'Mauricio Pochettino',
  'uruguay': 'Marcelo Bielsa',
  'uzbekistan': 'Srečko Katanec'
};


module.exports = {
  BASE,
  CORE,
  COACH_OVERRIDES,
  DATA_DIR,
  FIREBASE_DB_SECRET,
  FIREBASE_DB_URL,
  OUT_FILE,
  TOURNAMENT_END,
  TOURNAMENT_START,
};
