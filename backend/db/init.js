const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/db');

(async () => {
  try {
    await db.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    console.log('Schéma créé.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
