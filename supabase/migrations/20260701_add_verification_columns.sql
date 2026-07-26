-- ========================================================
-- AJOUT DES COLONNES DE VÉRIFICATION ET IS_VERIFIED
-- ========================================================

-- 1. Ajouter is_verified si elle n'existe pas
ALTER TABLE public.delivery_persons 
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 2. Ajouter verification_status  
ALTER TABLE public.delivery_persons 
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'none';

-- 3. Ajouter la raison du refus
ALTER TABLE public.delivery_persons 
  ADD COLUMN IF NOT EXISTS verification_rejection_reason text;

-- 4. Mettre à jour les livreurs qui ont soumis un document
--    S'ils ont déjà un cni_url mais pas encore de statut, on les met en 'pending'
UPDATE public.delivery_persons 
  SET verification_status = 'pending' 
  WHERE cni_url IS NOT NULL 
    AND (verification_status IS NULL OR verification_status = 'none');
