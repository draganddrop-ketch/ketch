export interface KeyringItem {
  id: string;
  name: string;
  category: string;
  menu_category?: string | null;
  sub_category?: string | null;
  price: number;
  image?: string;
  description?: string | null;
  gallery_images?: string[] | null;
  is_best?: boolean;
  is_new?: boolean;
}

export interface SelectedItem extends KeyringItem {
  uniqueId: string;
}
