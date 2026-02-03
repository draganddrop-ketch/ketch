/*
  # Add Home Categories Selection to Site Settings

  1. New Columns
    - `shop_home_categories` (text array) - Array of category IDs to display on Shop home page
    - `builder_home_categories` (text array) - Array of category IDs to display on Builder home page

  2. Default Values
    - shop_home_categories: empty array
    - builder_home_categories: empty array

  3. Notes
    - These settings allow admins to curate which categories appear on the home landing pages
    - Shop mode will display product sections organized by the selected categories
    - Builder mode will display product sections organized by the selected categories
    - Categories are filtered by their section field (SHOP or BUILDER)
*/

-- Add shop home categories array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'shop_home_categories'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN shop_home_categories text[] DEFAULT '{}';
  END IF;
END $$;

-- Add builder home categories array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'builder_home_categories'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN builder_home_categories text[] DEFAULT '{}';
  END IF;
END $$;