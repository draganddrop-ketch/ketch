import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FloatingFooter } from '../components/FloatingFooter';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { ArrowLeft } from 'lucide-react';

const PAGE_CONFIG: Record<string, { title: string; field: string }> = {
  terms: { title: 'Terms & Conditions', field: 'floating_footer_terms_content' },
  guide: { title: 'Guide', field: 'floating_footer_guide_content' },
  privacy: { title: 'Privacy Policy', field: 'floating_footer_privacy_content' },
};

export const InfoPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const config = PAGE_CONFIG[slug || ''];
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: settings?.global_bg_color || '#000', color: settings?.global_text_color || '#fff' }}>
        <p>Page not found</p>
      </div>
    );
  }

  const content = (settings as any)?.[config.field] || '';
  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: globalBg, color: globalText }}>
      <div className="sticky top-0 z-50" style={{ backgroundColor: `${globalBg}f2` }}>
        <Header cartCount={0} onLogoClick={() => navigate('/')} />
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 text-sm opacity-60 hover:opacity-100 transition-opacity" style={{ color: globalText }}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-2xl font-bold mb-8" style={{ color: globalText }}>{config.title}</h1>

        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: globalText, opacity: 0.85 }}>
          {content || '내용이 없습니다.'}
        </div>
      </div>

      <FloatingFooter />
    </div>
  );
};