-- ==============================================================================
-- SCRIPT COMPLET : CRÉATION DE LA TABLE delivery_persons + BUCKETS + RLS
-- ==============================================================================

-- 1. Création de la table delivery_persons (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.delivery_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  photo_url text,
  cni_url text,
  is_available boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  vehicle_type text NOT NULL,
  vehicle_details text,
  coverage_zones text[] NOT NULL,
  pricing_description text,
  description text,
  current_location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Activation de RLS sur la table
ALTER TABLE public.delivery_persons ENABLE ROW LEVEL SECURITY;

-- 3. Nettoyage des anciennes politiques sur la table (au cas où)
DROP POLICY IF EXISTS "delivery_persons_select" ON public.delivery_persons;
DROP POLICY IF EXISTS "delivery_persons_insert" ON public.delivery_persons;
DROP POLICY IF EXISTS "delivery_persons_update" ON public.delivery_persons;
DROP POLICY IF EXISTS "delivery_persons_delete" ON public.delivery_persons;

-- 4. Nouvelles politiques RLS pour delivery_persons
CREATE POLICY "delivery_persons_select"
  ON public.delivery_persons FOR SELECT
  USING (true);

CREATE POLICY "delivery_persons_insert"
  ON public.delivery_persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delivery_persons_update"
  ON public.delivery_persons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delivery_persons_delete"
  ON public.delivery_persons FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- BUCKETS ET STORAGE POLICIES
-- ==============================================================================

-- 5. Création des buckets de stockage
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('livreur-photos', 'livreur-photos', true),
  ('livreur-cni', 'livreur-cni', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Nettoyage des anciennes politiques de stockage (au cas où)
DROP POLICY IF EXISTS "Public Access for livreur-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload cni" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own cni" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own cni" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own cni" ON storage.objects;

-- 7. Politiques pour livreur-photos
CREATE POLICY "Public Access for livreur-photos"
ON storage.objects FOR SELECT USING (bucket_id = 'livreur-photos');

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'livreur-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE USING (bucket_id = 'livreur-photos' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE USING (bucket_id = 'livreur-photos' AND auth.uid() = owner);

-- 8. Politiques pour livreur-cni
CREATE POLICY "Authenticated users can upload cni"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'livreur-cni' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own cni"
ON storage.objects FOR SELECT USING (bucket_id = 'livreur-cni' AND auth.uid() = owner);

CREATE POLICY "Users can update their own cni"
ON storage.objects FOR UPDATE USING (bucket_id = 'livreur-cni' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own cni"
ON storage.objects FOR DELETE USING (bucket_id = 'livreur-cni' AND auth.uid() = owner);
