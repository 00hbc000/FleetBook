const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config');

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Authentification requise' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Jeton invalide' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès admin requis' });
  return next();
}

module.exports = { requireAuth, requireAdmin };
