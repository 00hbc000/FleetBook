// VULN-05 : clés FAUSSES volontairement écrites en dur pour le TP local.
// Ne jamais réutiliser ces valeurs hors de FleetBook de formation.
// VULN-06 : lodash@4.17.20 est verrouillé dans package.json pour Trivy (CVE-2021-23337).
import 'lodash';
export const JWT_SECRET = 'FAKE_JWT_SECRET_FOR_TRAINING';
export const API_KEY = 'FAKE_API_KEY_FOR_TRAINING';
