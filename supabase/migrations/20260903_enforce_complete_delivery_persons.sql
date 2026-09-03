-- ==============================================================================
-- Migration: Sécuriser la complétion des profils livreurs dans delivery_persons
-- Exclure tout profil incomplet (nom ou téléphone vide) de l'annuaire public
-- et interdire l'insertion de livreurs sans nom ou sans téléphone
-- ==============================================================================

-- 1. Nettoyer les éventuels profils incomplets
DELETE FROM public.delivery_persons 
WHERE name IS NULL OR TRIM(name) = '' OR phone IS NULL OR TRIM(phone) = '';

-- 2. Ajouter les contraintes d'intégrité CHECK
ALTER TABLE public.delivery_persons 
  DROP CONSTRAINT IF EXISTS delivery_persons_name_not_empty;
ALTER TABLE public.delivery_persons 
  ADD CONSTRAINT delivery_persons_name_not_empty CHECK (name IS NOT NULL AND TRIM(name) != '');

ALTER TABLE public.delivery_persons 
  DROP CONSTRAINT IF EXISTS delivery_persons_phone_not_empty;
ALTER TABLE public.delivery_persons 
  ADD CONSTRAINT delivery_persons_phone_not_empty CHECK (phone IS NOT NULL AND TRIM(phone) != '');

-- 3. Mettre à jour la vue publique delivery_persons_directory
CREATE OR REPLACE VIEW public.delivery_persons_directory AS
SELECT 
  id, user_id, name, phone, photo_url, is_available, rating, total_reviews, 
  vehicle_type, vehicle_details, coverage_zones, pricing_description, description, 
  current_location, created_at, updated_at
FROM public.delivery_persons
WHERE name IS NOT NULL AND TRIM(name) != '' 
  AND phone IS NOT NULL AND TRIM(phone) != '';

-- 4. Droits de lecture pour les clients
GRANT SELECT ON public.delivery_persons_directory TO anon, authenticated;
