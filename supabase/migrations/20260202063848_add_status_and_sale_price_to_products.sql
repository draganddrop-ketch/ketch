/*
  # Add status and sale_price to products table

  1. Changes
    - Add `status` column to products table (values: 'active', 'sold_out', 'hidden')
    - Add `sale_price` column to products table (nullable numeric for promotional pricing)
    - Add check constraint to ensure valid status values
    - Default status is 'active'
  
  2. Notes
    - Status 'active' = product is available for sale
    - Status 'sold_out' = product displays but cannot be purchased
    - Status 'hidden' = product not visible in shop frontend
    - sale_price is optional; when set and lower than price, shows as promotional pricing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'status'
  ) THEN
    ALTER TABLE products ADD COLUMN status text DEFAULT 'active' NOT NULL;
    ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('active', 'sold_out', 'hidden'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE products ADD COLUMN sale_price numeric;
  END IF;
END $$;
