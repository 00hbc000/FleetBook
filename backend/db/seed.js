const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const db = require('../src/db');

// Tous les noms, numéros et comptes sont inventés. Réexécuter remet les données à zéro.
const users = [
  ['Admin Démo', 'admin@fleetbook.test', 'admin', '0000000001', 'FICTIF-PERMIS-001'],
  ['Alice Test', 'alice@fleetbook.test', 'user', '0000000002', 'FICTIF-PERMIS-002'],
  ['Benoît Test', 'benoit@fleetbook.test', 'user', '0000000003', 'FICTIF-PERMIS-003'],
  ['Chloé Test', 'chloe@fleetbook.test', 'user', '0000000004', 'FICTIF-PERMIS-004'],
  ['Dina Test', 'dina@fleetbook.test', 'user', '0000000005', 'FICTIF-PERMIS-005']
];
const vehicles = [
  ['Citadine Azur', 'DEMO-001', 4, 35], ['Berline Sable', 'DEMO-002', 5, 48],
  ['SUV Atlas', 'DEMO-003', 5, 65], ['Minibus Jasmin', 'DEMO-004', 8, 85],
  ['Compacte Olive', 'DEMO-005', 4, 39], ['Utilitaire Test', 'DEMO-006', 2, 55],
  ['Électrique Démo', 'DEMO-007', 5, 70], ['Break Horizon', 'DEMO-008', 5, 52],
  ['Coupé Soleil', 'DEMO-009', 2, 60], ['Familiale Lune', 'DEMO-010', 7, 72]
];

(async () => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    await client.query('TRUNCATE bookings, vehicles, users RESTART IDENTITY CASCADE');
    const hash = await bcrypt.hash('Demo123!', 10);
    for (const [name, email, role, phone, license] of users) {
      await client.query('INSERT INTO users (name, email, role, phone, license_number, password_hash) VALUES ($1,$2,$3,$4,$5,$6)', [name, email, role, phone, license, hash]);
    }
    for (const [name, plate, seats, price] of vehicles) {
      await client.query('INSERT INTO vehicles (name, plate, seats, daily_price) VALUES ($1,$2,$3,$4)', [name, plate, seats, price]);
    }
    await client.query("INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, note) VALUES (2,1,'2030-06-01','2030-06-03','Départ démo'), (3,2,'2030-06-05','2030-06-06',''), (4,3,'2030-07-01','2030-07-02','Réservation test')");
    await client.query('COMMIT');
    console.log('5 utilisateurs, 10 véhicules, 3 réservations fictifs. Mot de passe : Demo123!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; db.end(); });
