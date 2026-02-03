/*
  # Add section column to categories table

  1. Changes
    - Add `section` column to `categories` table with values 'SHOP' or 'BUILDER'
    - Default value is 'BUILDER' for existing categories
    - Add check constraint to ensure valid values
  
  2. Security
    - No RLS changes needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'section'
  ) THEN
    ALTER TABLE categories ADD COLUMN section text DEFAULT 'BUILDER' NOT NULL;
    ALTER TABLE categories ADD CONSTRAINT categories_section_check CHECK (section IN ('SHOP', 'BUILDER'));
  END IF;
END $$;
