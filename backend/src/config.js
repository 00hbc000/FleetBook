// Configuration de démonstration : ne jamais réutiliser ces valeurs ailleurs.
// VULN-05 : secrets factices écrits en dur, uniquement pour la formation.
module.exports = {
  jwtSecret: 'FAKE_JWT_SECRET_FOR_TRAINING',
  apiKey: 'FAKE_API_KEY_FOR_TRAINING',
  databaseUrl: process.env.DATABASE_URL || 'postgres://fleetbook:fleetbook@localhost:5432/fleetbook',
  port: Number(process.env.PORT || 3000)
};
