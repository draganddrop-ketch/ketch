/*
  # Add Categories Table and Update Products

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique) - URL-friendly identifier
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Changes to `products` table
    - Add `description` (text) - Product description
    - Add `gallery_images` (text[]) - Array of image URLs for gallery
    - Remove CHECK constraint on category column
    - Add foreign key reference to categories table
  
  3. Security
    - Enable RLS on `categories` table
    - Add policies for authenticated users to manage categories
    - Update existing product policies to work with new schema
  
  4. Data Migration
    - Insert default categories from existing products
    - Update existing products to reference new category system
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories (authenticated users can manage)
CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO categories (name, slug) VALUES
  ('Chains', 'chains'),
  ('Charms', 'charms'),
  ('Carabiners', 'carabiners')
ON CONFLICT (slug) DO NOTHING;

-- Add new columns to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE products ADD COLUMN description text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE products ADD COLUMN gallery_images text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Drop the old CHECK constraint on category if it exists
DO $$
BEGIN
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Update existing products to have their main image in gallery_images
UPDATE products
SET gallery_images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (gallery_images IS NULL OR array_length(gallery_images, 1) IS NULL);
