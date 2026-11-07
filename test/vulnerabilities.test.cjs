// Garde-fou du scénario « avant » : ces défauts sont volontairement présents.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const source = path => readFileSync(path, 'utf8');
test('sept défauts pédagogiques explicitement marqués', () => {
  const code = [
    'src/lib/auth.ts', 'src/lib/training-config.ts',
    'src/app/api/vehicles/route.ts', 'src/app/api/vehicles/[id]/route.ts',
    'src/app/api/reservations/[id]/route.ts', 'src/app/dashboard/page.tsx',
    'src/app/api/auth/login/route.ts', 'next.config.ts',
  ].map(source).join('\n');
  for (let n = 1; n <= 7; n++) assert.match(code, new RegExp(`VULN-${String(n).padStart(2, '0')}`));
  assert.equal(require('../package.json').dependencies.lodash, '4.17.20');
  assert.match(source('src/db/schema.ts'), /note: text\("note"\)/);
  assert.match(source('src/app/api/auth/register/route.ts'), /const safeRole = "user"/);
});
