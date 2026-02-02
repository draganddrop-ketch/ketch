/*
  # Create Orders Table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique order identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `order_date` (timestamptz) - When the order was placed
      - `status` (text) - Order status (e.g., "PAID", "SHIPPED", "DELIVERED")
      - `total_price` (numeric) - Total order amount in Won
      - `custom_image_url` (text) - URL to the custom design snapshot
      - `items` (jsonb) - Array of order items with product details
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `orders` table
    - Add policy for users to read their own orders
    - Add policy for users to create their own orders
    - Add policy for users to update their own orders

  3. Important Notes
    - Users can only access their own order data
    - Order data is protected by user_id matching auth.uid()
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_date timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'PAID' NOT NULL,
  total_price numeric NOT NULL,
  custom_image_url text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_order_date_idx ON orders(order_date DESC);