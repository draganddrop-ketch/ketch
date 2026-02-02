/*
  # Add Target Category to Main Page Sections

  1. Table Modifications
    - Add `target_category_slug` (text) column to `main_page_sections` table
    - This column stores the category slug that a PRODUCT_LIST section should display
    - Allows linking main page sections to specific categories (including hidden ones)

  2. Use Cases
    - Link a product list section to a specific category
    - Display products from hidden categories on the main page
    - Create featured sections for special categories (e.g., "Weekend Special", "Summer Sale")
    - Category navigation tabs will only show visible categories
    - Main page can showcase any category regardless of visibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'main_page_sections' AND column_name = 'target_category_slug'
  ) THEN
    ALTER TABLE main_page_sections ADD COLUMN target_category_slug text;
  END IF;
END $$;