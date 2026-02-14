import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  id: number;
  brand_name: string;
  site_title: string | null;
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
  favicon_url: string | null;
  accent_color: string;
  bg_color: string; 
  font_family: string;
  announcement_text: string;
  announcement_bg_color: string;
  announcement_text_color: string;
  announcement_height: number;
  announcement_speed: number;
  announcement_width_type: 'FULL' | 'FIXED';
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
      root.style.setProperty('--main-font', settings.font_family || 'JetBrains Mono');
      root.style.setProperty('--global-bg', settings.global_bg_color || '#000000');
      root.style.setProperty('--global-text', settings.global_text_color || '#FFFFFF');
      root.style.setProperty('--accent-color', settings.accent_color);
      root.style.setProperty('--nav-text', settings.nav_text_color || '#FFFFFF');
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
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  return context;
};