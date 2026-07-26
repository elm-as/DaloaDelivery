-- Migration: Add AI detection columns to delivery_persons table
ALTER TABLE public.delivery_persons 
ADD COLUMN IF NOT EXISTS ai_verification_results jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_flagged boolean DEFAULT false;

COMMENT ON COLUMN public.delivery_persons.ai_verification_results IS 'Résultats de l''analyse d''IA sur les photos d''identité.';
COMMENT ON COLUMN public.delivery_persons.ai_flagged IS 'Indique si au moins une photo a été identifiée comme générée par IA.';
