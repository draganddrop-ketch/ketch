/*
  # Update Storage Policy for Public Folder

  1. Changes
    - Update the upload policy to allow files in the public/ folder path
    - This matches the frontend upload pattern: public/${Date.now()}.ext

  2. Security
    - Still restricted to authenticated users
    - Public read access maintained
*/

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (name LIKE 'public/%' OR name NOT LIKE '%/%')
  );
