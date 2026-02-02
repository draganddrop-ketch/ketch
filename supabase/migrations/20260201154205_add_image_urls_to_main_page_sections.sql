/*
  # Add Image URLs Array for Banner Sliders

  1. Table Modifications
    - Add `image_urls` (text array) column to `main_page_sections` table
    - This column will store multiple banner images for carousel/slider functionality

  2. Important Notes
    - Existing `image_url` column remains as fallback for single-image banners
    - `image_urls` will be used for multi-image sliders
    - Empty array by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE main_page_sections ADD COLUMN image_urls text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;