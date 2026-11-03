const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../src/db');
const app = require('../src/server');
const { jwtSecret } = require('../src/config');

// Tests rapides sans PostgreSQL : les réponses de pg sont simulées.
test('API locale : routes, rôles et vulnérabilités pédagogiques', async () => {
  const originalQuery = db.query;
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...parts) => warnings.push(parts.join(' '));
  const queries = [];
  const hash = await bcrypt.hash('Demo123!', 4);
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes('FROM users WHERE email')) return { rows: [{ id: 1, name: 'Admin Démo', email: 'admin@fleetbook.test', role: 'admin', password_hash: hash }] };
    if (sql.includes('FROM vehicles WHERE name ILIKE')) return { rows: [{ id: 10, name: 'Démo' }] };
    if (sql.includes('DELETE FROM vehicles')) return { rows: [{ id: 10 }] };
    if (sql.includes('FROM bookings b') && sql.includes('WHERE b.id=$1')) return { rows: [{ id: 2, user_id: 3, note: 'Test' }] };
    return { rows: [] };
  };
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const alice = jwt.sign({ id: 2, role: 'user' }, jwtSecret);
  const request = (url, options = {}) => fetch(base + url, options);
  try {
    assert.equal((await request('/')).status, 200);
    assert.equal((await request('/health')).status, 200);
    const badLogin = await request('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'alice@fleetbook.test', password: 'wrong-password' }) });
    assert.equal(badLogin.status, 401);
    assert.deepEqual(warnings, ['Connexion échouée']);
    const search = await request('/api/vehicles?search=' + encodeURIComponent("%' OR 1=1 -- "));
    assert.equal(search.status, 200);
    assert.match(queries.at(-1).sql, /OR 1=1/); // VULN-01 intentionnelle.
    const login = await request('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: "admin@fleetbook.test' -- ", password: 'Demo123!' }) });
    assert.equal(login.status, 200);
    assert.match(queries.at(-1).sql, /admin@fleetbook\.test' -- /);
    assert.equal((await login.json()).user.role, 'admin');
    const auth = { Authorization: `Bearer ${alice}` };
    assert.equal((await request('/api/users', { headers: auth })).status, 403);
    assert.equal((await request('/api/vehicles/10', { method: 'DELETE', headers: auth })).status, 200); // VULN-03.
    assert.equal((await request('/api/bookings/2', { headers: auth })).status, 200); // VULN-02.
    assert.equal((await request('/api/bookings/my')).status, 401);
    assert.equal((await request('/api/vehicles', { headers: { Origin: 'https://example.invalid' } })).headers.get('access-control-allow-origin'), '*'); // VULN-07.
  } finally {
    db.query = originalQuery;
    console.warn = originalWarn;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
