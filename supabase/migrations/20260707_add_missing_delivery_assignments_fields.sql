-- ==============================================================================
-- AJOUT DES CHAMPS MANQUANTS À delivery_assignments
-- La table existe déjà avec la plupart des champs de sécurité
-- ==============================================================================

-- 1. Ajouter les champs de localisation texte
ALTER TABLE public.delivery_assignments 
  ADD COLUMN IF NOT EXISTS pickup_location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dropoff_location text NOT NULL DEFAULT '';

-- 2. Ajouter les adresses GPS détaillées (jsonb)
ALTER TABLE public.delivery_assignments 
  ADD COLUMN IF NOT EXISTS pickup_address jsonb,
  ADD COLUMN IF NOT EXISTS dropoff_address jsonb;

-- 3. Ajouter le prix de livraison
ALTER TABLE public.delivery_assignments 
  ADD COLUMN IF NOT EXISTS delivery_price numeric NOT NULL DEFAULT 0;

-- 4. Ajouter la photo de livraison
ALTER TABLE public.delivery_assignments 
  ADD COLUMN IF NOT EXISTS delivery_photo_url text;

-- 5. Ajouter les champs de litige
ALTER TABLE public.delivery_assignments 
  ADD COLUMN IF NOT EXISTS disputed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_reason text;

-- 6. Ajouter ou mettre à jour la foreign key vers delivery_persons
-- Note: delivery_person_id existe déjà mais sans FK explicite dans le schéma fourni
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'delivery_assignments_delivery_person_id_fkey'
    AND table_name = 'delivery_assignments'
  ) THEN
    ALTER TABLE public.delivery_assignments 
      ADD CONSTRAINT delivery_assignments_delivery_person_id_fkey 
      FOREIGN KEY (delivery_person_id) REFERENCES public.delivery_persons(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- 7. Créer les index manquants pour les performances
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_delivery_person_id 
  ON public.delivery_assignments(delivery_person_id);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_pickup_confirmed 
  ON public.delivery_assignments(pickup_confirmed_by_seller);

-- 8. Créer ou mettre à jour le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_delivery_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_delivery_assignments_updated_at ON public.delivery_assignments;
CREATE TRIGGER trigger_update_delivery_assignments_updated_at
  BEFORE UPDATE ON public.delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_assignments_updated_at();
