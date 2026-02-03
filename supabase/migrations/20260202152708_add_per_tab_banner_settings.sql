/*
  # Add Per-Tab Banner Settings

  1. Changes
    - Add `builder_banner_transition` (text, default 'slide')
    - Add `builder_banner_speed` (integer, default 3000)
    - Add `shop_banner_transition` (text, default 'slide')
    - Add `shop_banner_speed` (integer, default 3000)

  2. Notes
    - These allow independent banner settings for Builder and Shop modes
    - Existing `banner_transition` and `banner_speed` remain as fallback global settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'builder_banner_transition'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN builder_banner_transition text DEFAULT 'slide';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'builder_banner_speed'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN builder_banner_speed integer DEFAULT 3000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'shop_banner_transition'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN shop_banner_transition text DEFAULT 'slide';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'shop_banner_speed'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN shop_banner_speed integer DEFAULT 3000;
  END IF;
END $$;