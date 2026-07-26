-- ========================================================
-- SECURITY FIX: Rétablir le statut privé du bucket
-- et restreindre l'accès SELECT aux propriétaires et aux admins
-- ========================================================

-- 1. Remettre le bucket en privé (sécurisé)
UPDATE storage.buckets SET public = false WHERE id = 'livreur-cni';

-- 2. Nettoyer les politiques existantes
DROP POLICY IF EXISTS "Public read for livreur-cni" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners and admins to view CNI" ON storage.objects;

-- 3. Créer la politique d'accès sécurisé
CREATE POLICY "Allow owners and admins to view CNI"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'livreur-cni'
  AND (
    auth.uid() = owner
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);
