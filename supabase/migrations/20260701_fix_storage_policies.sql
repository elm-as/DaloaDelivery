-- ========================================================
-- SCRIPT POUR CORRIGER LES ERREURS DE STOCKAGE (STORAGE)
-- ========================================================

-- 1. Création automatique des buckets (s'ils n'existent pas)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('livreur-photos', 'livreur-photos', true),
  ('livreur-cni', 'livreur-cni', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Suppression des anciennes politiques (pour éviter les conflits)
DROP POLICY IF EXISTS "Public Access for livreur-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload cni" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own cni" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own cni" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own cni" ON storage.objects;

-- 3. Ajout des règles de sécurité pour "livreur-photos" (Public)
-- Tout le monde peut voir les photos
CREATE POLICY "Public Access for livreur-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'livreur-photos');

-- Seuls les utilisateurs connectés peuvent envoyer une photo
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'livreur-photos' 
  AND auth.role() = 'authenticated'
);

-- Un utilisateur peut modifier sa propre photo
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'livreur-photos' AND auth.uid() = owner);

-- Un utilisateur peut supprimer sa propre photo
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'livreur-photos' AND auth.uid() = owner);

-- 4. Ajout des règles de sécurité pour "livreur-cni" (Privé)
-- Seuls les utilisateurs connectés peuvent envoyer leur CNI
CREATE POLICY "Authenticated users can upload cni"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'livreur-cni' 
  AND auth.role() = 'authenticated'
);

-- Seul le propriétaire (ou l'admin) peut voir sa CNI
CREATE POLICY "Users can view their own cni"
ON storage.objects FOR SELECT
USING (bucket_id = 'livreur-cni' AND auth.uid() = owner);

-- Un utilisateur peut modifier sa propre CNI
CREATE POLICY "Users can update their own cni"
ON storage.objects FOR UPDATE
USING (bucket_id = 'livreur-cni' AND auth.uid() = owner);

-- Un utilisateur peut supprimer sa propre CNI
CREATE POLICY "Users can delete their own cni"
ON storage.objects FOR DELETE
USING (bucket_id = 'livreur-cni' AND auth.uid() = owner);
