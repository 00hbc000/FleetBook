// Garde-fou de sécurité : les sept défauts intentionnels sont corrigés.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const source = path => readFileSync(path, 'utf8');
test('état de sécurité : 7 défauts corrigés', () => {
  const code = [
    'src/lib/auth.ts', 'src/lib/training-config.ts',
    'src/app/api/vehicles/route.ts', 'src/app/api/vehicles/[id]/route.ts',
    'src/app/api/reservations/[id]/route.ts', 'src/app/dashboard/page.tsx',
    'src/app/api/auth/login/route.ts', 'next.config.ts',
  ].map(source).join('\n');
  // Aucun marqueur de défaut volontaire ne doit rester dans le code corrigé.
  assert.doesNotMatch(code, /VULN-0[1-7]/);
  // Défaut 01 : requêtes paramétrées, plus de SQL concaténé.
  assert.doesNotMatch(code, /getUserByEmailUnsafe/);
  assert.doesNotMatch(code, /pool\.query\(/);
  assert.match(source('src/app/api/vehicles/route.ts'), /ilike\(vehicles\.brand/);
  // Défaut 02 : lecture limitée au propriétaire ou à l'administrateur.
  assert.match(source('src/app/api/reservations/[id]/route.ts'), /const scope = session\.role === "admin"/);
  // Défaut 03 : suppression de véhicule réservée aux administrateurs (PATCH et DELETE).
  const vehicleParId = source('src/app/api/vehicles/[id]/route.ts');
  assert.equal((vehicleParId.match(/session\.role !== "admin"/g) || []).length, 2);
  // Défaut 04 : la note s'affiche en texte simple échappé par React.
  assert.doesNotMatch(code, /dangerouslySetInnerHTML/);
  assert.match(source('src/app/dashboard/page.tsx'), /\{r\.note\}/);
  // Défaut 05 : secret JWT lu depuis l'environnement, aucune clé en dur.
  assert.doesNotMatch(code, /FAKE_(JWT_SECRET|API_KEY)_FOR_TRAINING/);
  assert.match(source('src/lib/training-config.ts'), /process\.env\.JWT_SECRET/);
  // Défaut 06 : lodash à jour.
  assert.equal(require('../package.json').dependencies.lodash, '4.18.1');
  // Défaut 07 : erreurs génériques, limitation des tentatives, en-têtes de protection, plus de CORS ouvert.
  assert.doesNotMatch(code, /stack/);
  assert.match(source('src/app/api/auth/login/route.ts'), /tooManyAttempts\(ip\)/);
  assert.match(source('src/app/api/auth/login/route.ts'), /recordFailedAttempt\(ip\)/);
  assert.doesNotMatch(code, /Access-Control-Allow-Origin/);
  assert.match(source('next.config.ts'), /Content-Security-Policy/);
  assert.match(source('next.config.ts'), /X-Frame-Options/);
  // Contrôles sains déjà présents, à ne pas casser.
  assert.match(source('src/db/schema.ts'), /note: text\(\"note\"\)/);
  assert.match(source('src/app/api/auth/register/route.ts'), /const safeRole = "user"/);
});
