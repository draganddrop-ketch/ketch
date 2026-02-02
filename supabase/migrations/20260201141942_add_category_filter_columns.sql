/*
  # Add Category Filter Configuration Columns

  ## Overview
  Adds advanced filtering capabilities to categories table to support:
  - Category ordering in the UI
  - Different filter modes (single category, all products, or mixed collections)
  - Multi-category collections (e.g., a "SHOP ALL" tab or "CHAINS + CHARMS" collection)

  ## Changes
  
  1. New Columns Added
    - `display_order` (integer, default 0)
      - Controls the sort order of categories in the UI
      - Lower numbers appear first
      
    - `filter_type` (text, default 'SINGLE')
      - 'SINGLE': Standard category filter (shows products from this category only)
      - 'ALL': Shows all products regardless of category (e.g., "SHOP ALL")
      - 'MIX': Shows products from multiple selected categories (e.g., collection tabs)
      
    - `included_categories` (text array, nullable)
      - Only used when filter_type = 'MIX'
      - Contains the names of categories to include in this collection
      - Example: ['CHAINS', 'CHARMS'] for a combined view

  2. Data Migration
    - Sets display_order for existing categories based on their creation date
    - All existing categories default to filter_type = 'SINGLE'
*/

-- Add display_order column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add filter_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'filter_type'
  ) THEN
    ALTER TABLE categories ADD COLUMN filter_type TEXT DEFAULT 'SINGLE' NOT NULL;
  END IF;
END $$;

-- Add included_categories column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'included_categories'
  ) THEN
    ALTER TABLE categories ADD COLUMN included_categories TEXT[];
  END IF;
END $$;

-- Set display_order for existing categories based on created_at
UPDATE categories
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM categories
) sub
WHERE categories.id = sub.id AND categories.display_order = 0;

-- Add check constraint for filter_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_filter_type_check'
  ) THEN
    ALTER TABLE categories
    ADD CONSTRAINT categories_filter_type_check
    CHECK (filter_type IN ('SINGLE', 'ALL', 'MIX'));
  END IF;
END $$;
