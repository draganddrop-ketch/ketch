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
  status?: 'active' | 'sold_out' | 'hidden';
  image?: string;
  image_url?: string;
  description?: string | null;
  gallery_images?: string[] | null;
  is_best?: boolean;
  is_new?: boolean;

  // ✅ [추가됨] 실제 사이즈(cm) 및 이미지 분석 데이터
  real_width_cm?: number;    // 사용자가 입력한 실제 가로 길이 (cm)
  object_px_width?: number;  // 투명 배경 제외한 물체의 실제 픽셀 너비
  image_width?: number;      // 원본 이미지의 전체 가로 픽셀 너비
}

export interface SelectedItem extends KeyringItem {
  uniqueId: string;
}