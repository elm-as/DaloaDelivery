-- ==============================================================================
-- SCRIPT DE SÉCURISATION DE LA TABLE delivery_persons (Red-Team Audit Fix)
-- ==============================================================================

-- 1. Création d'une fonction utilitaire pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Sécurisation des politiques RLS de la table delivery_persons
-- On supprime les anciennes politiques trop permissives
DROP POLICY IF EXISTS "Anyone can view delivery" ON public.delivery_persons;
DROP POLICY IF EXISTS "delivery_persons_select" ON public.delivery_persons;

-- Le livreur peut lire sa propre ligne entière
CREATE POLICY "Drivers can view their own profile" 
ON public.delivery_persons FOR SELECT 
USING (auth.uid() = user_id);

-- L'administrateur peut tout lire
CREATE POLICY "Admins can view all drivers" 
ON public.delivery_persons FOR SELECT 
USING (public.is_admin());

-- 3. Création de la Vue Sécurisée pour l'annuaire (exclut cni_url)
CREATE OR REPLACE VIEW public.delivery_persons_directory AS
SELECT 
  id, user_id, name, phone, photo_url, is_available, rating, total_reviews, 
  vehicle_type, vehicle_details, coverage_zones, pricing_description, description, 
  current_location, created_at, updated_at
FROM public.delivery_persons;

-- 4. Accorder les droits de lecture sur la vue
GRANT SELECT ON public.delivery_persons_directory TO anon, authenticated;
