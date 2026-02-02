/*
  # Update Main Page Sections Table

  1. Table Updates
    - Rename `filter_tag` to `filter_type` (if needed)
    - Rename `display_order` to `order_index` (if needed)
    - Add updated_at column
    - Update CHECK constraint on type column
    - Add CHECK constraint on filter_type column

  2. Security
    - Enable RLS on `main_page_sections` table
    - Add policy for public read access
    - Add policies for authenticated users to manage sections

  3. Important Notes
    - Updates existing table structure to match the page builder requirements
    - Products table already has is_best and is_new columns from previous migration
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'filter_tag'
  ) THEN
    ALTER TABLE main_page_sections RENAME COLUMN filter_tag TO filter_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE main_page_sections RENAME COLUMN display_order TO order_index;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE main_page_sections ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
END $$;

ALTER TABLE main_page_sections 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN order_index SET DEFAULT 0,
  ALTER COLUMN order_index SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'main_page_sections_type_check' 
    AND conrelid = 'main_page_sections'::regclass
  ) THEN
    ALTER TABLE main_page_sections 
      ADD CONSTRAINT main_page_sections_type_check 
      CHECK (type IN ('BANNER', 'PRODUCT_LIST'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'main_page_sections_filter_type_check' 
    AND conrelid = 'main_page_sections'::regclass
  ) THEN
    ALTER TABLE main_page_sections 
      ADD CONSTRAINT main_page_sections_filter_type_check 
      CHECK (filter_type IN ('NEW', 'BEST', 'ALL') OR filter_type IS NULL);
  END IF;
END $$;

ALTER TABLE main_page_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view main page sections" ON main_page_sections;
DROP POLICY IF EXISTS "Authenticated users can insert main page sections" ON main_page_sections;
DROP POLICY IF EXISTS "Authenticated users can update main page sections" ON main_page_sections;
DROP POLICY IF EXISTS "Authenticated users can delete main page sections" ON main_page_sections;

CREATE POLICY "Anyone can view main page sections"
  ON main_page_sections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert main page sections"
  ON main_page_sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update main page sections"
  ON main_page_sections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete main page sections"
  ON main_page_sections FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS main_page_sections_order_idx ON main_page_sections(order_index);