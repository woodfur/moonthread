-- ============================================
-- FMS — Migration 002: Asset quantity + image
-- ============================================

-- Add quantity and image_url columns to assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS image_url text;

-- Allow everyone to view assets (cleaners need this)
CREATE POLICY "Anyone can view assets" ON public.assets
  FOR SELECT USING (true);

-- Allow cleaners to add assets (insert only, no delete/update)
CREATE POLICY "Cleaners can add assets" ON public.assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'facility_manager', 'cleaning_supervisor')
    )
  );
