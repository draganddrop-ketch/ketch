/*
  # Fix Storage Upload Policy

  1. Changes
    - Remove the restrictive folder requirement from the upload policy
    - Allow authenticated users to upload directly to the bucket root
    - This fixes the issue where uploads were failing due to folder path requirements

  2. Security
    - Still restricted to authenticated users only
    - Public can still read all images
*/

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');
