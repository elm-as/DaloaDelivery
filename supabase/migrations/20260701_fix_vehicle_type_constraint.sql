-- Suppression de la contrainte qui bloque l'insertion des types de véhicules en français
ALTER TABLE public.delivery_persons DROP CONSTRAINT IF EXISTS delivery_persons_vehicle_type_check;

-- Optionnel: Ajouter une nouvelle contrainte avec les bonnes valeurs
-- ALTER TABLE public.delivery_persons ADD CONSTRAINT delivery_persons_vehicle_type_check CHECK (vehicle_type IN ('Moto', 'Vélo', 'Voiture', 'Triporteur'));
