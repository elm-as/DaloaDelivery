-- ==============================================================================
-- ADD ADMIN UPDATE POLICY TO delivery_persons
-- ==============================================================================

-- L'administrateur peut mettre à jour tous les livreurs (par ex: pour valider ou refuser les vérifications)
CREATE POLICY "Admins can update all drivers" 
ON public.delivery_persons FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());
