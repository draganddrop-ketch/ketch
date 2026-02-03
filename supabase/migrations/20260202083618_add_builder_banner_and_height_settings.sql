/*
  # Add Builder Banner Images and Banner Height Settings

  1. New Columns
    - `main_video_url` (text) - URL for background video in builder mode
    - `builder_banner_images` (text array) - Array of banner image URLs for builder mode
    - `shop_banner_height` (text) - CSS class for shop banner height (default: 'h-[80vh]')

  2. Default Values
    - main_video_url: null
    - builder_banner_images: empty array
    - shop_banner_height: 'h-[80vh]'

  3. Notes
    - These settings allow admins to configure banner images for builder mode
    - Shop banner height can be controlled with predefined CSS classes
    - Main video URL is for background video in builder mode
*/

-- Add main video URL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'main_video_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN main_video_url text DEFAULT NULL;
  END IF;
END $$;

-- Add builder banner images array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'builder_banner_images'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN builder_banner_images text[] DEFAULT '{}';
  END IF;
END $$;

-- Add shop banner height setting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'shop_banner_height'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN shop_banner_height text DEFAULT 'h-[80vh]';
  END IF;
END $$;