/*
  # Add Design & Theme Configuration Columns

  ## Overview
  Adds comprehensive design and theming capabilities to the site_settings table.
  This allows admins to customize the visual appearance of the main site including:
  - Canvas height for the keyring builder
  - Accent/neon color for highlights, buttons, and active elements
  - Background color for the main page
  - Font family selection for typography

  ## Changes
  
  1. New Columns Added
    - `canvas_height` (integer, default 700)
      - Controls the height of the canvas builder drop zone
      - Adjustable in steps of 10px
      
    - `accent_color` (text, default '#34d399')
      - Neon/accent color for prices, buttons, active tabs
      - Used for visual highlights throughout the site
      
    - `bg_color` (text, default '#000000')
      - Background color for the main page
      - Controls the overall page background
      
    - `font_family` (text, default 'JetBrains Mono')
      - Font family selection for site typography
      - Options: 'JetBrains Mono', 'Inter', 'Roboto'

  ## Implementation Notes
  - All columns have sensible defaults matching current design
  - accent_color defaults to the same value as primary_color
  - Changes are applied globally via CSS variables
  - Font families require corresponding font imports in the frontend
*/

-- Add canvas_height column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'canvas_height'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN canvas_height INTEGER DEFAULT 700 NOT NULL;
  END IF;
END $$;

-- Add accent_color column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'accent_color'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN accent_color TEXT DEFAULT '#34d399' NOT NULL;
  END IF;
END $$;

-- Add bg_color column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'bg_color'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN bg_color TEXT DEFAULT '#000000' NOT NULL;
  END IF;
END $$;

-- Add font_family column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'font_family'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN font_family TEXT DEFAULT 'JetBrains Mono' NOT NULL;
  END IF;
END $$;

-- Add check constraint for font_family
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_settings_font_family_check'
  ) THEN
    ALTER TABLE site_settings
    ADD CONSTRAINT site_settings_font_family_check
    CHECK (font_family IN ('JetBrains Mono', 'Inter', 'Roboto'));
  END IF;
END $$;

-- Update existing row with defaults if it exists
UPDATE site_settings
SET 
  canvas_height = COALESCE(canvas_height, 700),
  accent_color = COALESCE(accent_color, primary_color, '#34d399'),
  bg_color = COALESCE(bg_color, '#000000'),
  font_family = COALESCE(font_family, 'JetBrains Mono')
WHERE id = 1;
