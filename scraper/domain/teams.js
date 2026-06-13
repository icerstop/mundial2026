function normalizeTeamName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  n = n.replace(/á/g, 'a')
       .replace(/ç/g, 'c')
       .replace(/í/g, 'i')
       .replace(/ó/g, 'o')
       .replace(/ú/g, 'u')
       .replace(/ć/g, 'c')
       .replace(/š/g, 's')
       .replace(/đ/g, 'd')
       .replace(/ž/g, 'z')
       .replace(/ü/g, 'u')
       .replace(/ö/g, 'o')
       .replace(/ä/g, 'a')
       .replace(/ô/g, 'o');

  if (n.includes('ivory coast') || n.includes('cote d') || n.includes('cote d\'ivoire') || n.includes('cote divoire')) {
    return 'cote d\'ivoire';
  }
  if (n.includes('congo dr') || n.includes('dr congo') || n.includes('democratic republic of congo')) {
    return 'dr congo';
  }
  if (n.includes('cape verde') || n.includes('cabo verde')) {
    return 'cabo verde';
  }
  if (n.includes('curacao') || n.includes('curaçao')) {
    return 'curacao';
  }
  if (n.includes('bosnia') || n.includes('herzegovina')) {
    return 'bosnia and herzegovina';
  }
  if (n.includes('south korea') || n.includes('korea republic') || n.includes('korea rep') || n.includes('korea rd')) {
    return 'south korea';
  }
  if (n.includes('czechia') || n.includes('czech republic')) {
    return 'czechia';
  }
  if (n.includes('turkey') || n.includes('turkiye') || n.includes('türkiye')) {
    return 'türkiye';
  }
  // Remove Firebase-forbidden characters
  return n.replace(/[\/\.\$#\[\]]/g, '-');
}


module.exports = { normalizeTeamName };
