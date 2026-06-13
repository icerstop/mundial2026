
const { main } = require('./scraper/main');

main().catch(error => {
  console.error('Fatal error:', error);
  process.exitCode = 1;
});
