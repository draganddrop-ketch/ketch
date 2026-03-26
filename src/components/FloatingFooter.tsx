import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const FloatingFooter = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const instagramUrl = (settings as any)?.floating_footer_instagram_url || '';
  const footerText = (settings as any)?.floating_footer_text || '';
  const hasTerms = !!((settings as any)?.floating_footer_terms_content || '').trim();
  const hasGuide = !!((settings as any)?.floating_footer_guide_content || '').trim();
  const hasPrivacy = !!((settings as any)?.floating_footer_privacy_content || '').trim();

  const showBar = instagramUrl || footerText || hasTerms || hasGuide || hasPrivacy;
  if (!showBar) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur-sm" style={{ borderColor: '#e5e5e5' }}>
      <div className="w-full px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* 좌측: 인스타 아이콘 + 텍스트 */}
        <div className="flex items-center gap-3 min-w-0">
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-600 hover:text-gray-900 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          )}
          {footerText && (
            <span className="text-xs text-gray-500 truncate">{footerText}</span>
          )}
        </div>

        {/* 우측: 3개 링크 */}
        <div className="flex items-center gap-4 shrink-0">
          {hasTerms && (
            <button onClick={() => navigate('/page/terms')} className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap transition-colors">
              Terms & Conditions
            </button>
          )}
          {hasGuide && (
            <button onClick={() => navigate('/page/guide')} className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap transition-colors">
              Guide
            </button>
          )}
          {hasPrivacy && (
            <button onClick={() => navigate('/page/privacy')} className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap transition-colors">
              Privacy Policy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};