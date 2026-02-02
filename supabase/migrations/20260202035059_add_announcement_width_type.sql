/*
  # Add announcement width type option

  1. Changes
    - Add `announcement_width_type` column to `site_settings` table
    - Default value is 'FULL' for full-width display
    - Options: 'FULL' (full screen width) or 'FIXED' (1300px centered)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'announcement_width_type'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN announcement_width_type text DEFAULT 'FULL';
  END IF;
END $$;