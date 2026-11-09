// Garde-fou de sécurité : vérifie l'état du code vulnérabilité par vulnérabilité.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const source = path => readFileSync(path, 'utf8');
test('état de sécurité : 5 défauts restants, 2 corrigés', () => {
  const code = [
    'src/lib/auth.ts', 'src/lib/training-config.ts',
    'src/app/api/vehicles/route.ts', 'src/app/api/vehicles/[id]/route.ts',
    'src/app/api/reservations/[id]/route.ts', 'src/app/dashboard/page.tsx',
    'src/app/api/auth/login/route.ts', 'next.config.ts',
  ].map(source).join('\n');
  // Défauts volontairement encore présents (correction en cours) :
  for (let n of [1, 2, 3, 4, 7]) assert.match(code, new RegExp(`VULN-${String(n).padStart(2, '0')}`));
  // Défaut 05 corrigé : secret JWT lu depuis l'environnement, aucune clé en dur.
  assert.doesNotMatch(code, /FAKE_(JWT_SECRET|API_KEY)_FOR_TRAINING/);
  assert.match(source('src/lib/training-config.ts'), /process\.env\.JWT_SECRET/);
  // Défaut 06 corrigé : lodash à jour.
  assert.equal(require('../package.json').dependencies.lodash, '4.18.1');
  assert.match(source('src/db/schema.ts'), /note: text\(\"note\"\)/);
  assert.match(source('src/app/api/auth/register/route.ts'), /const safeRole = "user"/);
});
