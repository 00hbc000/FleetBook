-- FleetBook seed fictif (TP uniquement)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin FleetBook', 'admin@fleetbook.local', '$2b$10$BF6B8qVEF69oZg8PWofPXOlKAWFL3ZHYu5cTEKJg7.QazqyFnfJ26', 'admin'),
  ('Client Démo', 'client@fleetbook.local', '$2b$10$p3x6sOLVrJCFwPxn7t1OsOPKhZ8SG1yRlqGEP5/TUH0IArcz1KDGG', 'user'),
  ('Sara Martin', 'sara@exemple.com', '$2b$10$p3x6sOLVrJCFwPxn7t1OsOPKhZ8SG1yRlqGEP5/TUH0IArcz1KDGG', 'user')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name;

INSERT INTO vehicles (brand, model, year, license_plate, category, seats, transmission, fuel, price_per_day, status, description) VALUES
  ('Peugeot', '3008 GT', 2023, 'AB-123-CD', 'SUV', 5, 'Automatique', 'Diesel', '65.00', 'disponible', 'SUV familial spacieux, toit panoramique, GPS. Ideal vacances.'),
  ('Renault', 'Clio V', 2022, 'EF-456-GH', 'Citadine', 5, 'Manuelle', 'Essence', '35.00', 'disponible', 'Citadine agile, parfaite pour la ville et petits trajets.'),
  ('Tesla', 'Model 3', 2024, 'IJ-789-KL', 'Électrique', 5, 'Automatique', 'Électrique', '89.00', 'disponible', 'Berline electrique, 500 km autonomie, charge rapide.'),
  ('BMW', 'Serie 3', 2023, 'MN-012-OP', 'Premium', 5, 'Automatique', 'Hybride', '95.00', 'disponible', 'Premium confort, sieges cuir, aide a la conduite.'),
  ('Citroen', 'Berlingo', 2021, 'QR-345-ST', 'Utilitaire', 7, 'Manuelle', 'Diesel', '55.00', 'disponible', 'Utilitaire 7 places, grand coffre pour demenagement.'),
  ('Peugeot', '208', 2022, 'UV-678-WX', 'Citadine', 5, 'Manuelle', 'Essence', '32.00', 'loue', 'Compacte economique, faible consommation.'),
  ('Audi', 'Q5', 2023, 'YZ-901-AB', 'SUV', 5, 'Automatique', 'Diesel', '85.00', 'disponible', 'SUV premium quattro, parfait pour longs trajets.'),
  ('Toyota', 'Yaris Hybride', 2023, 'CD-234-EF', 'Berline', 5, 'Automatique', 'Hybride', '42.00', 'maintenance', 'En revision - retour prevu sous 5 jours.')
ON CONFLICT (license_plate) DO NOTHING;
