// Configuration d'exécution : le secret JWT vient de l'environnement
// (fichier .env local ou variable du conteneur), jamais du code source.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET manquant ou trop court (32 caractères minimum)");
  }
  return secret;
}
