-- ==============================================================================
-- MIGRATION: Ajout des photos de vérification (selfie + portrait live)
-- Date: 2026-07-09
-- ==============================================================================

-- 1. Ajouter les nouvelles colonnes à la table delivery_persons
ALTER TABLE public.delivery_persons
ADD COLUMN selfie_cni_url text,
ADD COLUMN portrait_live_url text;

-- 2. Création ou mise à jour de la vue sécurisée (annuaire public)
-- On s'assure d'exclure les informations très sensibles comme cni_url, selfie_cni_url, portrait_live_url
CREATE OR REPLACE VIEW public.delivery_persons_directory AS
SELECT 
  id, user_id, name, phone, photo_url, is_available, rating, total_reviews, 
  vehicle_type, vehicle_details, coverage_zones, pricing_description, description, 
  current_location, created_at, updated_at
FROM public.delivery_persons;

-- 3. Accorder les droits de lecture sur la vue
GRANT SELECT ON public.delivery_persons_directory TO anon, authenticated;
