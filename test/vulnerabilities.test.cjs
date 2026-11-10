// Garde-fou de sécurité : vérifie l'état du code vulnérabilité par vulnérabilité.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const source = path => readFileSync(path, 'utf8');
test('état de sécurité : 1 défaut restant, 6 corrigés', () => {
  const code = [
    'src/lib/auth.ts', 'src/lib/training-config.ts',
    'src/app/api/vehicles/route.ts', 'src/app/api/vehicles/[id]/route.ts',
    'src/app/api/reservations/[id]/route.ts', 'src/app/dashboard/page.tsx',
    'src/app/api/auth/login/route.ts', 'next.config.ts',
  ].map(source).join('\n');
  // Défauts volontairement encore présents (correction en cours) :
  for (let n of [7]) assert.match(code, new RegExp(`VULN-${String(n).padStart(2, '0')}`));
  // Défaut 01 corrigé : requêtes paramétrées, plus de SQL concaténé.
  assert.doesNotMatch(code, /getUserByEmailUnsafe/);
  assert.doesNotMatch(code, /pool\.query\(/);
  assert.match(source('src/app/api/vehicles/route.ts'), /ilike\(vehicles\.brand/);
  // Défaut 02 corrigé : lecture limitée au propriétaire ou à l'administrateur.
  assert.match(source('src/app/api/reservations/[id]/route.ts'), /const scope = session\.role === "admin"/);
  // Défaut 03 corrigé : suppression de véhicule réservée aux administrateurs (PATCH et DELETE).
  const vehicleParId = source('src/app/api/vehicles/[id]/route.ts');
  assert.equal((vehicleParId.match(/session\.role !== "admin"/g) || []).length, 2);
  // Défaut 04 corrigé : la note s'affiche en texte simple échappé par React.
  assert.doesNotMatch(code, /dangerouslySetInnerHTML/);
  assert.match(source('src/app/dashboard/page.tsx'), /\{r\.note\}/);
  // Défaut 05 corrigé : secret JWT lu depuis l'environnement, aucune clé en dur.
  assert.doesNotMatch(code, /FAKE_(JWT_SECRET|API_KEY)_FOR_TRAINING/);
  assert.match(source('src/lib/training-config.ts'), /process\.env\.JWT_SECRET/);
  // Défaut 06 corrigé : lodash à jour.
  assert.equal(require('../package.json').dependencies.lodash, '4.18.1');
  // Défaut 07 (partie 1) corrigé : erreurs génériques et limitation des tentatives de connexion.
  assert.doesNotMatch(code, /stack/);
  assert.match(source('src/app/api/auth/login/route.ts'), /tooManyAttempts\(ip\)/);
  assert.match(source('src/app/api/auth/login/route.ts'), /recordFailedAttempt\(ip\)/);
  assert.match(source('src/db/schema.ts'), /note: text\(\"note\"\)/);
  assert.match(source('src/app/api/auth/register/route.ts'), /const safeRole = "user"/);
});
