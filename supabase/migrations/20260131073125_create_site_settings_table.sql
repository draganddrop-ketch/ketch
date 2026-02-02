/*
  # Create site_settings table

  1. New Tables
    - `site_settings`
      - `id` (integer, primary key) - Always 1 for single-row configuration
      - `brand_name` (text) - The website brand/logo name
      - `announcement_text` (text) - Text shown in announcement bar
      - `primary_color` (text) - Hex color code for accent colors
      - `is_maintenance_mode` (boolean) - Toggle for maintenance mode
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `site_settings` table
    - Add policy for public read access (settings are public)
    - Add policy for authenticated users to update settings

  3. Initial Data
    - Insert default settings row with id=1
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  brand_name text NOT NULL DEFAULT 'KETCH',
  announcement_text text NOT NULL DEFAULT 'CUSTOM KEYRINGS • FREE SHIPPING OVER ₩50,000 • PREMIUM QUALITY',
  primary_color text NOT NULL DEFAULT '#34d399',
  is_maintenance_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to ensure only one row exists
ALTER TABLE site_settings ADD CONSTRAINT single_row_check CHECK (id = 1);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to read site settings (public data)
CREATE POLICY "Anyone can read site settings"
  ON site_settings
  FOR SELECT
  USING (true);

-- Policy for authenticated users to update site settings
CREATE POLICY "Authenticated users can update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (id = 1)
  WITH CHECK (id = 1);

-- Insert default settings row
INSERT INTO site_settings (id, brand_name, announcement_text, primary_color, is_maintenance_mode)
VALUES (1, 'KETCH', 'CUSTOM KEYRINGS • FREE SHIPPING OVER ₩50,000 • PREMIUM QUALITY', '#34d399', false)
ON CONFLICT (id) DO NOTHING;