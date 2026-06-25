/*
  # Add footer and share settings to site_settings

  1. Table Modifications - site_settings
    - Add `footer_content` (text)
    - Add `share_title` (text)
    - Add `share_description` (text)
    - Add `share_image_url` (text)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'footer_content'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN footer_content text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'share_title'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN share_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'share_description'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN share_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'share_image_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN share_image_url text;
  END IF;
END $$;
