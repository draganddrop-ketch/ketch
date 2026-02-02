/*
  # Fix Storage Policy for Anonymous Uploads

  1. Changes
    - Update the upload policy to allow both authenticated AND anonymous users
    - This allows uploads from the Admin panel without requiring authentication
    - Maintain public read access for all users

  2. Security Note
    - This allows anyone to upload to the product-images bucket
    - Consider adding authentication in production
*/

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Allow uploads to product-images bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    (name LIKE 'public/%' OR name NOT LIKE '%/%')
  );

DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;

CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');