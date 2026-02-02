/*
  # Add Category Visibility Toggle

  1. Table Modifications
    - Add `is_hidden` (boolean) column to `categories` table
    - Default value is `false` (visible)
    - This column controls whether categories appear on the main website

  2. Important Notes
    - Hidden categories will still be visible in Admin Panel (marked as hidden)
    - Main website will only show categories where `is_hidden = false`
    - Existing categories will default to visible (false)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'is_hidden'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_hidden boolean DEFAULT false;
  END IF;
END $$;