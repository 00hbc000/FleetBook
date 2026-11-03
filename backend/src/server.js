const express = require('express');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const _ = require('lodash'); // VULN-06 : lodash 4.17.20, version vulnérable (CVE-2021-23337).
const db = require('./db');
const { jwtSecret, port } = require('./config');
const { requireAuth, requireAdmin } = require('./auth');

const app = express();
app.use(express.json());
// VULN-07 : CORS ouvert, pas de casque/headers de sécurité et pas de limite de tentatives sur la connexion.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
const route = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const idOf = value => /^[1-9]\d*$/.test(String(value)) ? Number(value) : null;
const text = value => typeof value === 'string' ? value.trim() : '';

app.post('/api/register', route(async (req, res) => {
  const { name, email, password, phone, licenseNumber } = req.body;
  if (![name, email, password, phone, licenseNumber].every(v => typeof v === 'string' && v.trim()) || password.length < 8) {
    return res.status(400).json({ error: 'Tous les champs sont requis (mot de passe : 8 caractères minimum)' });
  }
  const hash = await bcrypt.hash(password, 10);
  const result = await db.query('INSERT INTO users (name, email, password_hash, role, phone, license_number) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role',
    [text(name), text(email), hash, 'user', text(phone), text(licenseNumber)]);
  res.status(201).json(result.rows[0]);
}));

app.get('/health', route(async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok' });
}));

app.post('/api/login', route(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || !email || typeof password !== 'string') {
    console.warn('Connexion échouée'); // Jamais de mot de passe dans les journaux.
    return res.status(400).json({ error: 'Identifiants requis' });
  }
  // VULN-01 : concaténation SQL volontaire sur l'email (ne pas réutiliser).
  const result = await db.query("SELECT id, name, email, role, password_hash FROM users WHERE email = '" + email + "' LIMIT 1");
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    console.warn('Connexion échouée'); // Ne pas inscrire le mot de passe dans les journaux.
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '2h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

app.get('/api/vehicles', route(async (req, res) => {
  const q = req.query.search;
  if (q !== undefined && typeof q !== 'string') return res.status(400).json({ error: 'Recherche invalide' });
  if (q) {
    // VULN-01 : recherche construite par concaténation SQL volontaire.
    const result = await db.query("SELECT id, name, plate, seats, daily_price FROM vehicles WHERE name ILIKE '%" + q + "%' ORDER BY id");
    return res.json(result.rows);
  }
  const result = await db.query('SELECT id, name, plate, seats, daily_price FROM vehicles ORDER BY id');
  res.json(result.rows);
}));

app.post('/api/vehicles', requireAuth, requireAdmin, route(async (req, res) => {
  const { name, plate, seats, dailyPrice } = req.body;
  if (!text(name) || !text(plate) || !Number.isInteger(seats) || seats < 1 || !Number.isFinite(dailyPrice) || dailyPrice < 0) return res.status(400).json({ error: 'Véhicule invalide' });
  const result = await db.query('INSERT INTO vehicles (name, plate, seats, daily_price) VALUES ($1,$2,$3,$4) RETURNING *', [text(name), text(plate), seats, dailyPrice]);
  res.status(201).json(result.rows[0]);
}));

app.put('/api/vehicles/:id', requireAuth, requireAdmin, route(async (req, res) => {
  const id = idOf(req.params.id);
  const { name, plate, seats, dailyPrice } = req.body;
  if (!id || !text(name) || !text(plate) || !Number.isInteger(seats) || seats < 1 || !Number.isFinite(dailyPrice) || dailyPrice < 0) return res.status(400).json({ error: 'Véhicule invalide' });
  const result = await db.query('UPDATE vehicles SET name=$1, plate=$2, seats=$3, daily_price=$4 WHERE id=$5 RETURNING *', [text(name), text(plate), seats, dailyPrice, id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Véhicule introuvable' });
  res.json(result.rows[0]);
}));

// VULN-03 : authentifié mais sans vérification du rôle admin sur la suppression.
app.delete('/api/vehicles/:id', requireAuth, route(async (req, res) => {
  const id = idOf(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identifiant invalide' });
  const result = await db.query('DELETE FROM vehicles WHERE id=$1 RETURNING id', [id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Véhicule introuvable' });
  res.json({ deleted: result.rows[0].id });
}));

app.get('/api/users', requireAuth, requireAdmin, route(async (req, res) => {
  const result = await db.query('SELECT id, name, email, role, phone, license_number FROM users ORDER BY id');
  res.json(result.rows);
}));

const bookingSelect = `SELECT b.id, b.user_id, b.vehicle_id, b.start_date, b.end_date, b.note,
  v.name AS vehicle_name, u.name AS user_name FROM bookings b
  JOIN vehicles v ON v.id=b.vehicle_id JOIN users u ON u.id=b.user_id`;

app.get('/api/bookings/my', requireAuth, route(async (req, res) => {
  const result = await db.query(`${bookingSelect} WHERE b.user_id=$1 ORDER BY b.id`, [req.user.id]);
  res.json(result.rows);
}));
app.get('/api/bookings', requireAuth, requireAdmin, route(async (req, res) => {
  const result = await db.query(`${bookingSelect} ORDER BY b.id`);
  res.json(result.rows);
}));
// VULN-02 : aucun contrôle de propriétaire sur la réservation demandée.
app.get('/api/bookings/:id', requireAuth, route(async (req, res) => {
  const id = idOf(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identifiant invalide' });
  const result = await db.query(`${bookingSelect} WHERE b.id=$1`, [id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Réservation introuvable' });
  res.json(result.rows[0]);
}));

app.post('/api/bookings', requireAuth, route(async (req, res) => {
  const { vehicleId, startDate, endDate } = req.body;
  const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
  if (!idOf(vehicleId) || !isDate(startDate) || !isDate(endDate) || endDate < startDate) return res.status(400).json({ error: 'Dates ou véhicule invalides' });
  const result = await db.query('INSERT INTO bookings (user_id, vehicle_id, start_date, end_date) VALUES ($1,$2,$3,$4) RETURNING id', [req.user.id, vehicleId, startDate, endDate]);
  res.status(201).json(result.rows[0]);
}));

app.post('/api/bookings/:id/note', requireAuth, route(async (req, res) => {
  const id = idOf(req.params.id);
  if (!id || typeof req.body.note !== 'string') return res.status(400).json({ error: 'Note invalide' });
  const result = await db.query('UPDATE bookings SET note=$1 WHERE id=$2 AND user_id=$3 RETURNING id, note', [req.body.note, id, req.user.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Réservation introuvable' });
  res.json(result.rows[0]);
}));

// En local, Express sert l'interface ; nginx servira ces mêmes fichiers en phase 2.
app.use(express.static(path.join(__dirname, '../../frontend')));
// VULN-07 : réponse d'erreur détaillée avec pile, sans filtrage.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message, stack: error.stack });
});

if (require.main === module) app.listen(port, '0.0.0.0', () => console.log(`FleetBook : http://localhost:${port}`));
module.exports = app;
