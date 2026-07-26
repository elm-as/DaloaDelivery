-- ========================================================
-- FIX: Permettre aux admins de voir les documents CNI
-- ET rendre le bucket livreur-cni public pour que les
-- URLs publiques (getPublicUrl) fonctionnent correctement
-- ========================================================

-- Option 1 (RECOMMANDÉE) : Rendre le bucket public
-- Les fichiers CNI ont des noms uniques avec UUID + timestamp,
-- donc ils ne sont pas devinables. L'accès en lecture est sûr.
UPDATE storage.buckets SET public = true WHERE id = 'livreur-cni';

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Users can view their own cni" ON storage.objects;

-- Nouvelle politique : tout le monde peut lire (bucket public)
CREATE POLICY "Public read for livreur-cni"
ON storage.objects FOR SELECT
USING (bucket_id = 'livreur-cni');
