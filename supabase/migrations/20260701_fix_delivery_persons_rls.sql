-- Fix RLS policies for delivery_persons table
-- Drop conflicting/broken policies and recreate cleanly

-- 1. Enable RLS (idempotent)
ALTER TABLE delivery_persons ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start clean
DROP POLICY IF EXISTS "delivery_persons_select" ON delivery_persons;
DROP POLICY IF EXISTS "delivery_persons_insert" ON delivery_persons;
DROP POLICY IF EXISTS "delivery_persons_update" ON delivery_persons;
DROP POLICY IF EXISTS "delivery_persons_delete" ON delivery_persons;
-- Also drop any old naming conventions
DROP POLICY IF EXISTS "Allow public read" ON delivery_persons;
DROP POLICY IF EXISTS "Allow authenticated insert" ON delivery_persons;
DROP POLICY IF EXISTS "Allow owner update" ON delivery_persons;
DROP POLICY IF EXISTS "Allow owner delete" ON delivery_persons;

-- 3. Recreate clean policies
-- Anyone can read delivery persons (public directory)
CREATE POLICY "delivery_persons_select"
  ON delivery_persons FOR SELECT
  USING (true);

-- Authenticated users can insert their own record
CREATE POLICY "delivery_persons_insert"
  ON delivery_persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own record
CREATE POLICY "delivery_persons_update"
  ON delivery_persons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own record
CREATE POLICY "delivery_persons_delete"
  ON delivery_persons FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add cni_url column if it doesn't exist (for CNI upload feature)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_persons' AND column_name = 'cni_url'
  ) THEN
    ALTER TABLE delivery_persons ADD COLUMN cni_url TEXT DEFAULT NULL;
  END IF;
END
$$;

-- 5. Create storage bucket for CNI documents (if not exists)
-- Note: Run this in the Supabase dashboard Storage section or via API
-- Bucket name: 'livreur-cni' - private bucket

-- 6. Create storage bucket for livreur photos (if not exists)
-- Bucket name: 'livreur-photos' - public bucket
