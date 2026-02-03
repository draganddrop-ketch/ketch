export interface KeyringItem {
  id: string;
  name: string;
  category: string;
  category_ids?: string[] | null;
  menu_category?: string | null;
  sub_category?: string | null;
  price: number;
  sale_price?: number | null;
  status?: 'active' | 'sold_out' | 'hidden';
  image?: string;
  description?: string | null;
  gallery_images?: string[] | null;
  is_best?: boolean;
  is_new?: boolean;
}

export interface SelectedItem extends KeyringItem {
  uniqueId: string;
}
