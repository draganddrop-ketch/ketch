/*
  # Add Banner Display Options

  1. New Columns
    - `show_title` (boolean) - Toggle to show/hide the title overlay on banners
    - `title_position` (text) - Position of title: 'center', 'bottom-left', 'bottom-right'
    - `dark_overlay` (boolean) - Toggle to show/hide dark overlay on banners
  
  2. Important Notes
    - These columns apply to BANNER type sections only
    - Default values: show_title=true, title_position='center', dark_overlay=true
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'show_title'
  ) THEN
    ALTER TABLE main_page_sections ADD COLUMN show_title boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'title_position'
  ) THEN
    ALTER TABLE main_page_sections ADD COLUMN title_position text DEFAULT 'center';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'dark_overlay'
  ) THEN
    ALTER TABLE main_page_sections ADD COLUMN dark_overlay boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'main_page_sections_title_position_check' 
    AND conrelid = 'main_page_sections'::regclass
  ) THEN
    ALTER TABLE main_page_sections 
      ADD CONSTRAINT main_page_sections_title_position_check 
      CHECK (title_position IN ('center', 'bottom-left', 'bottom-right') OR title_position IS NULL);
  END IF;
END $$;