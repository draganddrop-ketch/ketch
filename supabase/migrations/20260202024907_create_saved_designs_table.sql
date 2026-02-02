/*
  # Create Saved Designs Table

  1. New Tables
    - `saved_designs`
      - `id` (bigint, primary key) - Unique identifier for the saved design
      - `user_id` (uuid, foreign key) - References auth.users
      - `design_name` (text) - Name of the saved design
      - `design_data` (jsonb) - JSON data containing canvas state (items, positions, rotations)
      - `snapshot_image` (text) - Data URL of canvas snapshot image
      - `created_at` (timestamptz) - Timestamp when design was created
      - `updated_at` (timestamptz) - Timestamp when design was last updated
  
  2. Security
    - Enable RLS on `saved_designs` table
    - Add policy for users to view their own designs
    - Add policy for users to insert their own designs
    - Add policy for users to update their own designs
    - Add policy for users to delete their own designs
*/

CREATE TABLE IF NOT EXISTS saved_designs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  design_name text DEFAULT 'My Design' NOT NULL,
  design_data jsonb NOT NULL,
  snapshot_image text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE saved_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own designs" ON saved_designs;
DROP POLICY IF EXISTS "Users can insert own designs" ON saved_designs;
DROP POLICY IF EXISTS "Users can update own designs" ON saved_designs;
DROP POLICY IF EXISTS "Users can delete own designs" ON saved_designs;

CREATE POLICY "Users can view own designs"
  ON saved_designs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own designs"
  ON saved_designs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs"
  ON saved_designs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own designs"
  ON saved_designs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_designs_user_id_idx ON saved_designs(user_id);
CREATE INDEX IF NOT EXISTS saved_designs_created_at_idx ON saved_designs(created_at DESC);