import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  id: number;
  brand_name: string;
  site_title: string | null;
  footer_content: string | null;
  share_title: string | null;
  share_description: string | null;
  share_image_url: string | null;
  kakao_js_key: string | null;
  banner_height: number;
  shop_banner_images: string[] | null;
  builder_banner_images: string[] | null;
  shop_home_categories: string[] | null;
  builder_home_categories: string[] | null;
  banner_transition: string | null;
  banner_speed: number | null;
  is_maintenance_mode: boolean;
  canvas_height: number;
  shop_slot1_images: string[] | null;
  shop_slot2_images: string[] | null;
  shop_slot3_images: string[] | null;
  global_bg_color: string;
  global_text_color: string;
  layout_border_color: string;
  layout_border_opacity: number;
  canvas_bg_color: string;
  canvas_bg_image: string | null;
  nav_text_color: string;
  product_card_bg: string;
  product_text_color: string;
  product_sub_text_color: string;
  product_accent_color: string;
  product_name_size: number;
  product_category_size: number;
  product_price_size: number;
  logo_url: string | null;
  logo_width: string | null;
  symbol_url: string | null;
  symbol_size: number | null;
  logo_padding_top: number | null;
  logo_padding_bottom: number | null;
  favicon_url: string | null;
  accent_color: string;
  bg_color: string; 
  font_family: string;
  // Typography 세부 설정 (폰트, 사이즈, 컬러, 두께, 자간)
  font_nav: string | null;
  font_nav_size: number | null;
  font_nav_color: string | null;
  font_nav_weight: string | null;
  font_nav_spacing: number | null;
  font_category: string | null;
  font_category_size: number | null;
  font_category_color: string | null;
  font_category_weight: string | null;
  font_category_spacing: number | null;
  // compact 모드 카테고리
  font_compact_cat: string | null;
  font_compact_cat_size: number | null;
  font_compact_cat_color: string | null;
  font_compact_cat_weight: string | null;
  font_compact_cat_spacing: number | null;
  // 상품 카드
  font_card_name: string | null;
  font_card_name_size: number | null;
  font_card_name_color: string | null;
  font_card_name_weight: string | null;
  font_card_name_spacing: number | null;
  font_card_cat: string | null;
  font_card_cat_size: number | null;
  font_card_cat_color: string | null;
  font_card_cat_weight: string | null;
  font_card_price: string | null;
  font_card_price_size: number | null;
  font_card_price_color: string | null;
  font_card_price_weight: string | null;
  // 상품 상세
  font_detail_title: string | null;
  font_detail_title_size: number | null;
  font_detail_title_color: string | null;
  font_detail_title_weight: string | null;
  font_detail_title_spacing: number | null;
  font_detail_body: string | null;
  font_detail_body_size: number | null;
  font_detail_body_color: string | null;
  font_detail_body_weight: string | null;
  announcement_text: string;
  announcement_bg_color: string;
  announcement_text_color: string;
  announcement_height: number;
  announcement_speed: number;
  announcement_width_type: 'FULL' | 'FIXED';
  // Floating Footer Bar
  floating_footer_instagram_url: string | null;
  floating_footer_text: string | null;
  floating_footer_terms_content: string | null;
  floating_footer_guide_content: string | null;
  floating_footer_privacy_content: string | null;
  floating_footer_font: string | null;
  floating_footer_font_size: number | null;
  floating_footer_font_color: string | null;
  floating_footer_padding_y: number | null;
  floating_footer_padding_x: number | null;
  // Product Detail Page Style
  detail_page_padding_top: number | null;
  detail_page_max_width: number | null;
  detail_price_font: string | null;
  detail_price_size: number | null;
  detail_price_color: string | null;
  detail_price_weight: string | null;
  detail_category_font: string | null;
  detail_category_size: number | null;
  detail_category_color: string | null;
  // Header
  header_bg_color: string | null;
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  getBorderStyle: () => React.CSSProperties; 
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      // ✅ [복구] 사용자님 요청대로 ID 1번을 사용합니다.
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
      
      if (error) throw error;
      if (data) {
        // 엑센트 컬러 통합 로직은 유지 (product_accent_color 우선)
        const realAccent = data.product_accent_color || data.accent_color || '#34d399';
        setSettings({
          ...data,
          accent_color: realAccent,
          product_accent_color: realAccent
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);
  
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      const f = settings.font_family || 'Pretendard';
      root.style.setProperty('--main-font', f);
      root.style.setProperty('--global-bg', settings.global_bg_color || '#000000');
      root.style.setProperty('--global-text', settings.global_text_color || '#FFFFFF');
      root.style.setProperty('--accent-color', settings.accent_color);
      root.style.setProperty('--nav-text', settings.nav_text_color || '#FFFFFF');

      // Typography CSS 변수 적용
      const navColorVal = settings.nav_text_color || '#FFFFFF';
      root.style.setProperty('--font-nav', `'${settings.font_nav || f}', sans-serif`);
      root.style.setProperty('--font-nav-size', `${settings.font_nav_size || 15}px`);
      root.style.setProperty('--font-nav-color', settings.font_nav_color || navColorVal);
      root.style.setProperty('--font-nav-weight', settings.font_nav_weight || '700');
      root.style.setProperty('--font-nav-spacing', `${settings.font_nav_spacing ?? 0.05}em`);

      root.style.setProperty('--font-category', `'${settings.font_category || f}', sans-serif`);
      root.style.setProperty('--font-category-size', `${settings.font_category_size || 13}px`);
      root.style.setProperty('--font-category-color', settings.font_category_color || navColorVal);
      root.style.setProperty('--font-category-weight', settings.font_category_weight || '500');
      root.style.setProperty('--font-category-spacing', `${settings.font_category_spacing ?? 0.1}em`);

      root.style.setProperty('--font-compact-cat', `'${settings.font_compact_cat || settings.font_category || f}', sans-serif`);
      root.style.setProperty('--font-compact-cat-size', `${settings.font_compact_cat_size || settings.font_category_size || 12}px`);
      root.style.setProperty('--font-compact-cat-color', settings.font_compact_cat_color || settings.font_category_color || navColorVal);
      root.style.setProperty('--font-compact-cat-weight', settings.font_compact_cat_weight || settings.font_category_weight || '500');
      root.style.setProperty('--font-compact-cat-spacing', `${settings.font_compact_cat_spacing ?? settings.font_category_spacing ?? 0.1}em`);

      root.style.setProperty('--font-card-name', `'${settings.font_card_name || f}', sans-serif`);
      root.style.setProperty('--font-card-name-size', `${settings.font_card_name_size || 16}px`);
      root.style.setProperty('--font-card-name-color', settings.font_card_name_color || settings.product_text_color || '#FFFFFF');
      root.style.setProperty('--font-card-name-weight', settings.font_card_name_weight || '700');
      root.style.setProperty('--font-card-name-spacing', `${settings.font_card_name_spacing ?? 0}em`);

      root.style.setProperty('--font-card-cat', `'${settings.font_card_cat || f}', sans-serif`);
      root.style.setProperty('--font-card-cat-size', `${settings.font_card_cat_size || 12}px`);
      root.style.setProperty('--font-card-cat-color', settings.font_card_cat_color || settings.product_sub_text_color || '#9ca3af');
      root.style.setProperty('--font-card-cat-weight', settings.font_card_cat_weight || '400');

      root.style.setProperty('--font-card-price', `'${settings.font_card_price || f}', sans-serif`);
      root.style.setProperty('--font-card-price-size', `${settings.font_card_price_size || 14}px`);
      root.style.setProperty('--font-card-price-color', settings.font_card_price_color || settings.product_accent_color || '#34d399');
      root.style.setProperty('--font-card-price-weight', settings.font_card_price_weight || '600');

      root.style.setProperty('--font-detail-title', `'${settings.font_detail_title || f}', sans-serif`);
      root.style.setProperty('--font-detail-title-size', `${settings.font_detail_title_size || 32}px`);
      root.style.setProperty('--font-detail-title-color', settings.font_detail_title_color || settings.global_text_color || '#FFFFFF');
      root.style.setProperty('--font-detail-title-weight', settings.font_detail_title_weight || '700');
      root.style.setProperty('--font-detail-title-spacing', `${settings.font_detail_title_spacing ?? 0}em`);

      root.style.setProperty('--font-detail-body', `'${settings.font_detail_body || f}', sans-serif`);
      root.style.setProperty('--font-detail-body-size', `${settings.font_detail_body_size || 14}px`);
      root.style.setProperty('--font-detail-body-color', settings.font_detail_body_color || settings.global_text_color || '#FFFFFF');
      root.style.setProperty('--font-detail-body-weight', settings.font_detail_body_weight || '400');
      // 로고 패딩
      root.style.setProperty('--logo-padding-top', `${settings.logo_padding_top ?? 8}px`);
      root.style.setProperty('--logo-padding-bottom', `${settings.logo_padding_bottom ?? 8}px`);

      const faviconHref = settings.favicon_url || '';
      let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = faviconHref || '/vite.svg';

      const fallbackTitle = settings.brand_name || 'My Store';
      const siteTitle = settings.site_title || fallbackTitle;
      const shareTitle = settings.share_title || siteTitle;
      const shareDescription = settings.share_description || settings.announcement_text || fallbackTitle;
      const shareImage = settings.share_image_url || settings.logo_url || `${window.location.origin}/vite.svg`;

      document.title = siteTitle;

      const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
        let tag = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute(attr, key);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      };

      upsertMeta('name', 'description', shareDescription);
      upsertMeta('property', 'og:type', 'website');
      upsertMeta('property', 'og:title', shareTitle);
      upsertMeta('property', 'og:description', shareDescription);
      upsertMeta('property', 'og:image', shareImage);
      upsertMeta('property', 'og:url', window.location.href);
      upsertMeta('name', 'twitter:card', 'summary_large_image');
      upsertMeta('name', 'twitter:title', shareTitle);
      upsertMeta('name', 'twitter:description', shareDescription);
      upsertMeta('name', 'twitter:image', shareImage);
    }
  }, [settings]);

  const refreshSettings = async () => { await fetchSettings(); };

  const getBorderStyle = () => {
    if (!settings) return { borderColor: 'rgba(255,255,255,0.3)' };
    const hex = settings.layout_border_color || '#FFFFFF';
    const opacity = settings.layout_border_opacity ?? 0.3;
    let r = 255, g = 255, b = 255;
    if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return { borderColor: `rgba(${r}, ${g}, ${b}, ${opacity})` };
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings, getBorderStyle }}>
      {loading ? null : children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  return context;
};