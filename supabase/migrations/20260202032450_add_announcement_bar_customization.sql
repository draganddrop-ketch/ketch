/*
  # Add Announcement Bar Customization Columns

  1. Changes
    - Add `announcement_bg_color` (text, nullable) - Background color of announcement bar
    - Add `announcement_text_color` (text, nullable) - Text color of announcement bar
    - Add `announcement_height` (integer, nullable) - Height of announcement bar in pixels
    - Add `announcement_speed` (integer, nullable) - Animation speed in seconds

  2. Default Values
    - announcement_bg_color: '#09090b' (Dark zinc)
    - announcement_text_color: '#a1a1aa' (Light zinc)
    - announcement_height: 40px
    - announcement_speed: 20 seconds
*/

-- Add announcement bar customization columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'announcement_bg_color'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN announcement_bg_color text DEFAULT '#09090b';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'announcement_text_color'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN announcement_text_color text DEFAULT '#a1a1aa';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'announcement_height'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN announcement_height integer DEFAULT 40;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'announcement_speed'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN announcement_speed integer DEFAULT 20;
  END IF;
END $$;
