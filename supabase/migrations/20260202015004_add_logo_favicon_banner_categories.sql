/*
  # Add Logo, Favicon, Banner Height and Dual Categories

  1. Table Modifications - site_settings
    - Add `logo_url` (text) - URL to uploaded logo image
    - Add `logo_width` (text) - Logo width (e.g., "120px", "150px")
    - Add `favicon_url` (text) - URL to uploaded favicon
    - Add `site_title` (text) - Site title for browser tab
    - Add `banner_height` (integer) - Main banner height in pixels

  2. Table Modifications - products
    - Add `menu_category` (text) - Broad category for header menu filtering
    - Add `sub_category` (text) - Specific product type for display

  3. Important Notes
    - Logo and favicon URLs will reference Supabase storage
    - menu_category used for navigation, sub_category for product cards
    - banner_height defaults to 400px
*/

-- Add site settings columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'logo_width'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN logo_width text DEFAULT '120px';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'favicon_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN favicon_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'site_title'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN site_title text DEFAULT 'My Store';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'banner_height'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN banner_height integer DEFAULT 400;
  END IF;
END $$;

-- Add product category columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'menu_category'
  ) THEN
    ALTER TABLE products ADD COLUMN menu_category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sub_category'
  ) THEN
    ALTER TABLE products ADD COLUMN sub_category text;
  END IF;
END $$;