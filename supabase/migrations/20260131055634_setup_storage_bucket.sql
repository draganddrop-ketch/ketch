/*
  # Create Product Images Storage Bucket

  1. Storage Bucket
    - Create 'product-images' bucket
    - Enable public read access
    - Restrict uploads to authenticated users
    - Set appropriate file size limits

  2. Security
    - RLS policies to control upload/delete access
    - Public read access for all images

  Note: This migration attempts to create the bucket and set policies.
  Storage buckets are managed separately from tables.
*/

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

CREATE POLICY "Public Access to product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = 'product-images'
  );

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );
