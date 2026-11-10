// Vérifications légères des données de formation ; sans base PostgreSQL.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const bcrypt = require('bcryptjs');
const seed = readFileSync('scripts/seed.sql', 'utf8');
test('comptes fictifs et mots de passe de démonstration', async () => {
  assert.match(seed, /admin@fleetbook\.local/);
  assert.match(seed, /client@fleetbook\.local/);
  const hashes = [...seed.matchAll(/\$2b\$10\$[./A-Za-z0-9]{53}/g)].map(m => m[0]);
  assert.equal(hashes.length, 3);
  assert.equal(await bcrypt.compare('Admin123!', hashes[0]), true);
  assert.equal(await bcrypt.compare('Client123!', hashes[1]), true);
});
