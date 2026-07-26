-- ========================================================
-- SECURITY UPDATE: Prendre en compte les nouveaux rôles 
-- (admin, superadmin, moderator, helper) pour l'accès aux CNI
-- ========================================================

-- 1. Nettoyer les anciennes politiques SELECT pour livreur-cni
DROP POLICY IF EXISTS "Allow owners and admins to view CNI" ON storage.objects;
DROP POLICY IF EXISTS "Public read for livreur-cni" ON storage.objects;

-- 2. Créer la politique d'accès sécurisé prenant en compte tous les rôles administratifs
CREATE POLICY "Allow owners and management to view CNI"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'livreur-cni'
  AND (
    auth.uid() = owner
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'moderator', 'helper')
    )
  )
);
