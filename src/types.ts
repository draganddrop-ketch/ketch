export interface KeyringItem {
  id: string;
  name: string;
  category: string;
  category_ids?: string[] | null;
  menu_category?: string | null;
  sub_category?: string | null;
  price: number;
  sale_price?: number | null;
  stock_quantity?: number; // ✅ 이 줄을 추가해주세요!
  status?: 'active' | 'sold_out' | 'hidden';
  image?: string;
  image_url?: string; // Admin에서 사용하는 필드 호환성
  description?: string | null;
  gallery_images?: string[] | null;
  is_best?: boolean;
  is_new?: boolean;
}

export interface SelectedItem extends KeyringItem {
  uniqueId: string;
}
