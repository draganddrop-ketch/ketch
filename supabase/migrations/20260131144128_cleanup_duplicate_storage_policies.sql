/*
  # Cleanup Duplicate Storage Policies

  1. Changes
    - Remove all existing policies on storage.objects for product-images bucket
    - Create clean, simplified policies for INSERT and SELECT operations
    - Ensure anonymous users can upload and everyone can read

  2. Security
    - Public (anonymous) users can upload images
    - Public (anonymous) users can read images
    - No authentication required
*/

-- Drop all existing policies for product-images
DROP POLICY IF EXISTS "Public Access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Create clean INSERT policy for uploads
CREATE POLICY "Anyone can upload to product-images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = 'public'
  );

-- Create clean SELECT policy for reading
CREATE POLICY "Anyone can read from product-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');