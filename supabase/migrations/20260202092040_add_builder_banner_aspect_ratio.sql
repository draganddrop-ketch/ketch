/*
  # Add Builder Banner Aspect Ratio Setting

  1. Changes
    - Add `builder_banner_ratio` column to `site_settings` table
      - Type: text
      - Default: 'wide' (2:1 ratio)
      - Options: 'wide' (2:1), 'standard' (16:9), 'square' (1:1), 'auto' (original)
  
  2. Notes
    - This setting allows admins to control the aspect ratio of the builder banner slider
    - The default 'wide' ratio provides a cinematic banner experience
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'builder_banner_ratio'
  ) THEN
    ALTER TABLE site_settings 
    ADD COLUMN builder_banner_ratio text DEFAULT 'wide';
  END IF;
END $$;