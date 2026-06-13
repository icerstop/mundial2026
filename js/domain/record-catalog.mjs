import {
  checkPlayerHatTrick,
  getCountryMatchesCount,
  getFranceMatchesCount,
  getPlayerStats,
} from './record-stats.mjs';

export function buildRecordCatalog(data) {
  const completed = (data.matches || []).filter(match => match.status.completed);
  let totalYellow = 0;
  let totalRed = 0;
  let totalAttendance = 0;
  for (const match of completed) {
    if (match.attendance) totalAttendance += match.attendance;
    for (const team of match.details?.teamStats || []) {
      totalYellow += parseInt(team.stats.yellowCards?.value || 0, 10);
      totalRed += parseInt(team.stats.redCards?.value || 0, 10);
    }
  }

  const messi = getPlayerStats(data, 'Messi');
  const ronaldo = getPlayerStats(data, 'Ronaldo');
  const mbappe = getPlayerStats(data, 'Mbappé');
  const courtois = getPlayerStats(data, 'Courtois');
  const checkPlayerHatTrick2026 = name => checkPlayerHatTrick(data, name);
  const franceMatches = () => getFranceMatchesCount(data);
  const countryMatches = (localName, englishName) =>
    getCountryMatchesCount(data, localName, englishName);

  return [
    {
      id: 'total_goals',
      icon: '⚽',
      title: 'Łączna liczba goli w turnieju',
      desc: 'Poprzedni rekord wynosi 172 bramki (Katar 2022). W 48-zespołowym formacie niemal na pewno padnie nowy rekord.',
      target: 172,
      current: data.stats.totalGoals,
      unit: ' goli',
      type: data.stats.totalGoals > 172 ? 'achieved' : 'chasing',
      statText: `Rekord: 172 (2022) | Obecnie: ${data.stats.totalGoals}`
    },
    {
      id: 'yellow_cards',
      icon: '🟨',
      title: 'Łączna liczba żółtych kartek',
      desc: 'Najwięcej żółtych kartek w historii pokazano w 2006 roku w Niemczech (345).',
      target: 345,
      current: totalYellow,
      unit: ' kartek',
      type: totalYellow > 345 ? 'achieved' : 'chasing',
      statText: `Rekord: 345 (2006) | Obecnie: ${totalYellow}`
    },
    {
      id: 'red_cards',
      icon: '🟥',
      title: 'Łączna liczba czerwonych kartek',
      desc: 'Rekord wszech czasów to 28 czerwonych kartek pokazanych na MŚ 2006.',
      target: 28,
      current: totalRed,
      unit: ' kartek',
      type: totalRed > 28 ? 'achieved' : 'chasing',
      statText: `Rekord: 28 (2006) | Obecnie: ${totalRed}`
    },
    {
      id: 'longest_road',
      icon: '🏆',
      title: 'Najdłuższa droga do tytułu',
      desc: 'Zwycięzca turnieju rozegra 8 meczów (dotychczasowy rekord to 7 meczów dla mistrza).',
      target: 8,
      current: 8,
      unit: ' meczów',
      type: 'achieved',
      statText: 'Status: Pewny (nowy format) 🏆'
    },
    {
      id: 'messi_appearances',
      icon: '🇦🇷',
      title: 'Śrubowanie rekordu występów Messiego',
      desc: 'Leo Messi jest już rekordzistą z 26 występami na MŚ. Każdy kolejny mecz wydłuża ten rekord.',
      target: 27,
      current: 26 + messi.appearances,
      unit: ' meczów',
      type: messi.appearances > 0 ? 'achieved' : 'chasing',
      statText: `Rekord: 26 | Obecnie: ${26 + messi.appearances}`
    },
    {
      id: 'messi_wins',
      icon: '🇦🇷',
      title: 'Najwięcej wygranych meczów na MŚ',
      desc: 'Rekord należy do Miroslava Klose (17 zwycięstw). Leo Messi ma 16 i potrzebuje dwóch wygranych do pobicia.',
      target: 18,
      current: 16 + messi.wins,
      unit: ' wygranych',
      type: (16 + messi.wins) >= 18 ? 'achieved' : 'chasing',
      statText: `Rekord Klosego: 17 | Obecnie Messi: ${16 + messi.wins}`
    },
    {
      id: 'six_world_cups',
      icon: '🌍',
      title: 'Pierwszy zawodnik na 6 mundialach',
      desc: 'Leo Messi (a także Cristiano Ronaldo) ma szansę zagrać na 6. turnieju. Argentyna gra mecz otwarcia wcześniej niż Portugalia.',
      target: 1,
      current: messi.appearances > 0 ? 1 : 0,
      unit: '',
      type: messi.appearances > 0 ? 'achieved' : 'chasing',
      statText: messi.appearances > 0 ? 'Osiągnięty przez Messiego! 🏆' : 'Czeka na pierwszy mecz Argentyny'
    },
    {
      id: 'top_scorer_history',
      icon: '⚽',
      title: 'Top strzelec w historii MŚ',
      desc: 'Miroslav Klose prowadzi z 16 golami. Leo Messi (13 goli) i Kylian Mbappé (12 goli) gonią ten rekord.',
      target: 16,
      current: Math.max(13 + messi.goals, 12 + mbappe.goals),
      unit: ' goli',
      type: Math.max(13 + messi.goals, 12 + mbappe.goals) > 16 ? 'achieved' : 'chasing',
      statText: `Rekord Klosego: 16 | Messi: ${13 + messi.goals} | Mbappé: ${12 + mbappe.goals}`
    },
    {
      id: 'goals_six_tournaments',
      icon: '⚽',
      title: 'Gole w 6 różnych turniejach',
      desc: 'Cristiano Ronaldo jest jedynym graczem z golami w 5 edycjach. Gol w 2026 przedłuży ten kosmiczny rekord do 6.',
      target: 1,
      current: ronaldo.goals > 0 ? 1 : 0,
      unit: '',
      type: ronaldo.goals > 0 ? 'achieved' : 'chasing',
      statText: ronaldo.goals > 0 ? 'Osiągnięty przez Ronaldo! 🏆' : 'Czeka na gola Ronaldo'
    },
    {
      id: 'oldest_scorer_knockout',
      icon: '👴',
      title: 'Najstarszy strzelec fazy pucharowej',
      desc: 'Obecny rekordzista to Pepe (39 lat, 283 dni). Kandydaci na pobicie: C. Ronaldo (41 l.), L. Modrić (40 l.), E. Džeko (40 l.).',
      target: 40,
      current: 39,
      unit: ' lat',
      type: 'chasing',
      statText: 'Rekord Pepe: 39 lat | Faza pucharowa jeszcze nie ruszyła'
    },
    {
      id: 'coach_matches',
      icon: '⚽',
      title: 'Najwięcej meczów jako trener',
      desc: 'Helmut Schön prowadził zespoły w 25 meczach. Didier Deschamps (Francja) ma obecnie 19 i musi awansować do półfinału.',
      target: 25,
      current: 19 + franceMatches(),
      unit: ' meczów',
      type: (19 + franceMatches()) > 25 ? 'achieved' : 'chasing',
      statText: `Rekord Schöna: 25 | Obecnie Deschamps: ${19 + franceMatches()}`
    },
    {
      id: 'hattricks_tournaments',
      icon: '⚽',
      title: 'Najwięcej turniejów z hattrickami',
      desc: 'Gabriel Batistuta strzelał hattricki na 2 turniejach. Kane, Mbappé, G. Ramos i Ronaldo mają po 1 i szukają drugiego.',
      target: 2,
      current: (checkPlayerHatTrick2026('Kane') || checkPlayerHatTrick2026('Mbappé') || checkPlayerHatTrick2026('Ramos') || checkPlayerHatTrick2026('Ronaldo')) ? 2 : 1,
      unit: ' turnieje',
      type: 'chasing',
      statText: 'Rekord Batistuty: 2 | Żaden z kandydatów nie strzelił hat-tricka w 2026'
    },
    {
      id: 'two_golden_boots',
      icon: '🥇',
      title: 'Dwa Złote Buty (Klasyfikacje Strzelców)',
      desc: 'Nikt nigdy nie wygrał klasyfikacji strzelców dwukrotnie. Zdobywca z 2022 r. Kylian Mbappé może być pierwszym.',
      target: 1,
      current: 0,
      unit: '',
      type: 'chasing',
      statText: 'Mbappé walczy o obronę tytułu króla strzelców'
    },
    {
      id: 'final_appearances',
      icon: '🇫🇷',
      title: 'Najwięcej występów w finałach MŚ',
      desc: 'Rekord to 3 finały (Cafu). Lionel Messi i Kylian Mbappé zagrali w 2 finałach i mogą wyrównać ten rekord.',
      target: 3,
      current: 2,
      unit: ' finały',
      type: 'chasing',
      statText: 'Rekord Cafu: 3 | Messi i Mbappé mają po 2'
    },
    {
      id: 'clean_sheets',
      icon: '🧹',
      title: 'Rekord czystych kont bramkarza',
      desc: 'Rekord wynosi 10 czystych kont (Shilton, Barthez). Thibaut Courtois ma 7 i ma szansę go pobić.',
      target: 10,
      current: 7 + courtois.cleanSheets,
      unit: ' czystych kont',
      type: (7 + courtois.cleanSheets) >= 10 ? 'achieved' : 'chasing',
      statText: `Rekord: 10 | Obecnie Courtois: ${7 + courtois.cleanSheets}`
    },
    {
      id: 'captain_title_defense',
      icon: '🇦🇷',
      title: 'Pierwszy kapitan z obroną tytułu',
      desc: 'Żaden kapitan w historii nie wzniósł Pucharu Świata dwukrotnie z rzędu. Leo Messi może być pierwszy.',
      target: 1,
      current: 0,
      unit: '',
      type: 'chasing',
      statText: 'Argentyna rozpoczyna obronę tytułu mistrzowskiego'
    },
    {
      id: 'goal_involvements_pele',
      icon: '🅰️',
      title: 'Samodzielny rekord udziałów przy golach (G+A)',
      desc: 'Messi i Pelé dzielą rekord 21 udziałów przy bramkach. Jeden punkt kanadyjski Messiego w 2026 da mu samodzielny rekord.',
      target: 22,
      current: 21 + messi.goals + messi.assists,
      unit: ' punktów',
      type: (21 + messi.goals + messi.assists) >= 22 ? 'achieved' : 'chasing',
      statText: `Rekord: 21 | Obecnie Messi: ${21 + messi.goals + messi.assists}`
    },
    {
      id: 'oldest_field_player_final',
      icon: '👴',
      title: 'Najstarszy gracz z pola w finale MŚ',
      desc: 'Rekord to Nils Liedholm (35 lat). Jeśli Portugalia dojdzie do finału z Cristiano Ronaldo (41 lat), pobije go o 6 lat.',
      target: 41,
      current: 35,
      unit: ' lat',
      type: 'chasing',
      statText: 'Rekord Liedholma: 35 lat | Portugalia walczy w turnieju'
    },
    {
      id: 'mbappe_finals_goal',
      icon: '🇫🇷',
      title: 'Kylian Mbappé — gole w 3 różnych finałach',
      desc: 'Mbappé strzelał już w 2018 i 2022. Trafienie w finale 2026 uczyniłoby go jedynym graczem z golami w 3 różnych finałach MŚ.',
      target: 3,
      current: 0,
      unit: ' finały',
      type: 'chasing',
      statText: 'Mbappé ma już na koncie rekordowe 4 gole w finałach MŚ'
    },
    {
      id: 'azteca_stadium',
      icon: '🏟️',
      title: 'Estadio Azteca — trzykrotny gospodarz MŚ',
      desc: 'Kultowy stadion w Meksyku staje się pierwszym obiektem w historii, który ugości mecze trzech edycji MŚ (1970, 1986, 2026).',
      target: 1,
      current: 1,
      unit: '',
      type: 'achieved',
      statText: 'Status: Osiągnięty (mecz otwarcia za nami) 🏆'
    },
    {
      id: 'total_attendance',
      icon: '🌍',
      title: 'Rekord frekwencji całego turnieju',
      desc: 'Rekord wszech czasów wynosi 3 587 538 widzów (USA 1994). Z racji 104 meczów i olbrzymich stadionów ten rekord pęknie bez problemu.',
      target: 3587538,
      current: totalAttendance,
      unit: ' widzów',
      type: totalAttendance > 3587538 ? 'achieved' : 'chasing',
      statText: `Rekord z 1994: 3.58M | Obecnie na stadionach: ${totalAttendance.toLocaleString('pl')}`
    },
    {
      id: 'oldest_coach',
      icon: '👴',
      title: 'Rekord najstarszego selekcjonera MŚ',
      desc: 'Dotychczasowy rekord należał do Otto Rehhagela (71 lat). W tym roku pobije go aż trzech trenerów: Broos (74), Koubek (74) i Advocaat (78).',
      target: 1,
      current: (countryMatches('Czechia', 'czech') > 0 || countryMatches('South Africa', 'africa') > 0 || countryMatches('Curacao', 'cura') > 0) ? 1 : 0,
      unit: '',
      type: (countryMatches('Czechia', 'czech') > 0 || countryMatches('South Africa', 'africa') > 0 || countryMatches('Curacao', 'cura') > 0) ? 'achieved' : 'chasing',
      statText: (countryMatches('Czechia', 'czech') > 0 || countryMatches('South Africa', 'africa') > 0 || countryMatches('Curacao', 'cura') > 0) ? 'Osiągnięty! (Rekordzistą Dick Advocaat - 78 lat) 🏆' : 'Czeka na mecze Czech, RPA lub Curaçao'
    }
  ];
}
