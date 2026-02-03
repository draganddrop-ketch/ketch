/*
  # Add Shop Banner Settings to Site Settings

  1. New Columns
    - `shop_banner_images` (text array) - Array of image URLs for the shop banner slider
    - `banner_transition` (text) - Transition effect for banners: 'slide' or 'fade'
    - `banner_speed` (integer) - Autoplay speed in milliseconds (default: 3000)
    - `main_video_url` (text) - Main video URL for builder mode (previously managed elsewhere)

  2. Default Values
    - shop_banner_images: empty array
    - banner_transition: 'slide'
    - banner_speed: 3000 (3 seconds)
    - main_video_url: null

  3. Notes
    - These settings will be used to configure the main page display differently for SHOP and BUILDER modes
    - SHOP mode will show an image slider using shop_banner_images
    - BUILDER mode will continue to show video background and drop zone
*/

-- Add shop banner images array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'shop_banner_images'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN shop_banner_images text[] DEFAULT '{}';
  END IF;
END $$;

-- Add banner transition type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'banner_transition'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN banner_transition text DEFAULT 'slide';
  END IF;
END $$;

-- Add banner speed (in milliseconds)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'banner_speed'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN banner_speed integer DEFAULT 3000;
  END IF;
END $$;

-- Add main video URL for builder mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'main_video_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN main_video_url text DEFAULT NULL;
  END IF;
END $$;