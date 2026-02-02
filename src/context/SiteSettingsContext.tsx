import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  id: number;
  brand_name: string;
  announcement_text: string;
  announcement_bg_color: string | null;
  announcement_text_color: string | null;
  announcement_height: number | null;
  announcement_speed: number | null;
  announcement_width_type: string | null;
  primary_color: string;
  is_maintenance_mode: boolean;
  canvas_height: number;
  accent_color: string;
  bg_color: string;
  font_family: string;
  logo_url: string | null;
  logo_width: string | null;
  favicon_url: string | null;
  site_title: string | null;
  banner_height: number;
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);

        document.documentElement.style.setProperty('--accent-color', data.accent_color || '#34d399');
        document.documentElement.style.setProperty('--bg-color', data.bg_color || '#000000');
        document.documentElement.style.setProperty('--main-font', data.font_family || 'JetBrains Mono');
        document.documentElement.style.setProperty('--canvas-height', `${data.canvas_height || 700}px`);
        document.documentElement.style.setProperty('--banner-height', `${data.banner_height || 400}px`);

        if (data.site_title) {
          document.title = data.site_title;
        }

        if (data.favicon_url) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.favicon_url;
        }
      }
    } catch (err) {
      console.error('Failed to fetch site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
