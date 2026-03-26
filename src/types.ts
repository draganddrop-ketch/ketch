export interface KeyringItem {
  id: string;
  name: string;
  category: string;
  category_ids?: string[] | null;
  menu_category?: string | null;
  sub_category?: string | null;
  price: number;
  sale_price?: number | null;
  stock_quantity?: number;
  status?: 'active' | 'sold_out' | 'hidden' | 'soldout';
  image?: string;
  image_url?: string;
  dropzone_image_url?: string | null;
  description?: string | null;
  short_description?: string | null;
  gallery_images?: string[] | null;
  is_best?: boolean;
  is_new?: boolean;
  display_order?: number | null;
  product_type?: 'SHOP' | 'BUILDER' | 'BOTH' | null;
  real_width_cm?: number;
  object_px_width?: number;
  image_width?: number;
}

export interface SelectedItem extends KeyringItem {
  uniqueId: string;
}