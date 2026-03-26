import { useState, useEffect } from 'react';
import { Save, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const SiteSettingsForm = () => {
  const { settings, refreshSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'footerbar'>('general');
  
  const [formData, setFormData] = useState({
    brand_name: '',
    announcement_text: '',
    announcement_bg_color: '#09090b',
    announcement_text_color: '#a1a1aa',
    announcement_height: 40,
    announcement_speed: 20,
    announcement_width_type: 'FULL',
    primary_color: '#34d399',
    is_maintenance_mode: false,
    canvas_height: 700,
    bg_color: '#000000',
    font_family: 'JetBrains Mono',
    logo_url: '',
    symbol_url: '',
    symbol_size: 28,
    logo_width: '120px',
    logo_padding_top: 8,
    logo_padding_bottom: 8,
    favicon_url: '',
    site_title: 'My Store',
    footer_content: '',
    share_title: '',
    share_description: '',
    share_image_url: '',
    kakao_js_key: '',
    banner_height: 400,
    nav_text_color: '#FFFFFF',
    header_bg_color: '',
  });

  const [footerBarData, setFooterBarData] = useState({
    floating_footer_instagram_url: '',
    floating_footer_text: '',
    floating_footer_terms_content: '',
    floating_footer_guide_content: '',
    floating_footer_privacy_content: '',
    floating_footer_font: '',
    floating_footer_font_size: 11,
    floating_footer_font_color: '#888888',
    floating_footer_padding_y: 8,
    floating_footer_padding_x: 16,
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSymbol, setUploadingSymbol] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingShareImage, setUploadingShareImage] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        brand_name: settings.brand_name || '',
        announcement_text: settings.announcement_text || '',
        announcement_bg_color: settings.announcement_bg_color || '#09090b',
        announcement_text_color: settings.announcement_text_color || '#a1a1aa',
        announcement_height: settings.announcement_height || 40,
        announcement_speed: settings.announcement_speed || 20,
        announcement_width_type: settings.announcement_width_type || 'FULL',
        primary_color: settings.primary_color || '#34d399',
        is_maintenance_mode: settings.is_maintenance_mode || false,
        canvas_height: settings.canvas_height || 700,
        bg_color: settings.bg_color || '#000000',
        font_family: settings.font_family || 'JetBrains Mono',
        logo_url: settings.logo_url || '',
        symbol_url: (settings as any).symbol_url || '',
        symbol_size: (settings as any).symbol_size ?? 28,
        logo_width: settings.logo_width || '120px',
        logo_padding_top: (settings as any).logo_padding_top ?? 8,
        logo_padding_bottom: (settings as any).logo_padding_bottom ?? 8,
        favicon_url: settings.favicon_url || '',
        site_title: settings.site_title || 'My Store',
        footer_content: settings.footer_content || '',
        share_title: settings.share_title || '',
        share_description: settings.share_description || '',
        share_image_url: settings.share_image_url || '',
        kakao_js_key: settings.kakao_js_key || '',
        banner_height: settings.banner_height || 400,
        nav_text_color: settings.nav_text_color || '#FFFFFF',
        header_bg_color: (settings as any).header_bg_color || '',
      });
      setFooterBarData({
        floating_footer_instagram_url: (settings as any).floating_footer_instagram_url || '',
        floating_footer_text: (settings as any).floating_footer_text || '',
        floating_footer_terms_content: (settings as any).floating_footer_terms_content || '',
        floating_footer_guide_content: (settings as any).floating_footer_guide_content || '',
        floating_footer_privacy_content: (settings as any).floating_footer_privacy_content || '',
        floating_footer_font: (settings as any).floating_footer_font || '',
        floating_footer_font_size: (settings as any).floating_footer_font_size || 11,
        floating_footer_font_color: (settings as any).floating_footer_font_color || '#888888',
        floating_footer_padding_y: (settings as any).floating_footer_padding_y ?? 8,
        floating_footer_padding_x: (settings as any).floating_footer_padding_x ?? 16,
      });
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value),
    }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('brand-assets').upload(filePath, file);
    if (uploadError) { console.error('Upload error:', uploadError); return null; }
    const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setUploadingLogo(true); const url = await uploadImage(file); if (url) { setFormData(prev => ({ ...prev, logo_url: url })); setMessage('Logo uploaded'); } else setMessage('Failed'); } catch (error) { console.error(error); setMessage('Failed'); } finally { setUploadingLogo(false); }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setUploadingFavicon(true); const url = await uploadImage(file); if (url) { setFormData(prev => ({ ...prev, favicon_url: url })); setMessage('Favicon uploaded'); } else setMessage('Failed'); } catch (error) { console.error(error); setMessage('Failed'); } finally { setUploadingFavicon(false); }
  };

  const handleShareImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setUploadingShareImage(true);
      const url = await uploadImage(file);
      if (url) {
        setFormData(prev => ({ ...prev, share_image_url: url }));
        setMessage('Share image uploaded');
      } else setMessage('Failed');
    } catch (error) {
      console.error(error);
      setMessage('Failed');
    } finally {
      setUploadingShareImage(false);
    }
  };

  const handleRemoveLogo = () => { setFormData(prev => ({ ...prev, logo_url: '' })); setMessage('Logo removed.'); };
  const handleRemoveSymbol = () => { setFormData(prev => ({ ...prev, symbol_url: '' })); setMessage('Symbol removed.'); };
  const handleSymbolUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setUploadingSymbol(true); const url = await uploadImage(file); if (url) { setFormData(prev => ({ ...prev, symbol_url: url })); setMessage('Symbol uploaded'); } else setMessage('Failed'); } catch (error) { console.error(error); setMessage('Failed'); } finally { setUploadingSymbol(false); }
  };
  const handleRemoveShareImage = () => { setFormData(prev => ({ ...prev, share_image_url: '' })); setMessage('Share image removed.'); };
  const handleLogoWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => { let value = e.target.value.trim(); if (value && !value.endsWith('px')) { const numericValue = value.replace(/\D/g, ''); if (numericValue) value = `${numericValue}px`; } setFormData(prev => ({ ...prev, logo_width: value })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true); setMessage('');
      
      const { error } = await supabase.from('site_settings').update({
          brand_name: formData.brand_name,
          announcement_text: formData.announcement_text,
          announcement_bg_color: formData.announcement_bg_color,
          announcement_text_color: formData.announcement_text_color,
          announcement_height: formData.announcement_height,
          announcement_speed: formData.announcement_speed,
          announcement_width_type: formData.announcement_width_type,
          primary_color: formData.primary_color,
          is_maintenance_mode: formData.is_maintenance_mode,
          canvas_height: formData.canvas_height,
          bg_color: formData.bg_color,
          font_family: formData.font_family,
          logo_url: formData.logo_url,
          symbol_url: formData.symbol_url,
          symbol_size: formData.symbol_size,
          logo_width: formData.logo_width,
          logo_padding_top: formData.logo_padding_top,
          logo_padding_bottom: formData.logo_padding_bottom,
          favicon_url: formData.favicon_url,
          site_title: formData.site_title,
          footer_content: formData.footer_content,
          share_title: formData.share_title,
          share_description: formData.share_description,
          share_image_url: formData.share_image_url,
          kakao_js_key: formData.kakao_js_key,
          banner_height: formData.banner_height,
          nav_text_color: formData.nav_text_color,
          header_bg_color: formData.header_bg_color || null,
          updated_at: new Date().toISOString(),
        })
        // ✅ [복구] ID 1번을 업데이트합니다.
        .eq('id', 1);

      if (error) throw error;
      
      setMessage('Settings saved successfully!');
      await refreshSettings();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { console.error(err); setMessage('Failed to save settings: ' + (err as any).message); } finally { setSaving(false); }
  };

  const handleSaveFooterBar = async () => {
    try {
      setSaving(true); setMessage('');
      const { error } = await supabase.from('site_settings').update({
        floating_footer_instagram_url: footerBarData.floating_footer_instagram_url,
        floating_footer_text: footerBarData.floating_footer_text,
        floating_footer_terms_content: footerBarData.floating_footer_terms_content,
        floating_footer_guide_content: footerBarData.floating_footer_guide_content,
        floating_footer_privacy_content: footerBarData.floating_footer_privacy_content,
        floating_footer_font: footerBarData.floating_footer_font || null,
        floating_footer_font_size: footerBarData.floating_footer_font_size,
        floating_footer_font_color: footerBarData.floating_footer_font_color,
        floating_footer_padding_y: footerBarData.floating_footer_padding_y,
        floating_footer_padding_x: footerBarData.floating_footer_padding_x,
        updated_at: new Date().toISOString(),
      }).eq('id', 1);
      if (error) throw error;
      setMessage('Settings saved successfully!');
      await refreshSettings();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { console.error(err); setMessage('Failed to save: ' + (err as any).message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {message && <div className={`px-4 py-3 border rounded-lg ${message.includes('Failed') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}><p className="text-sm">{message}</p></div>}

      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => setActiveTab('general')} className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeTab === 'general' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>⚙️ 기본 설정</button>
        <button onClick={() => setActiveTab('footerbar')} className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeTab === 'footerbar' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>📎 Footer Bar</button>
      </div>

      {activeTab === 'footerbar' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            📎 화면 하단에 고정되는 Footer Bar 설정입니다. 인스타그램 링크, 텍스트, 그리고 Terms/Guide/Privacy 페이지 내용을 관리하세요.
          </div>
          <div className="border-b border-gray-300 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">SNS & 텍스트</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label><input type="text" value={footerBarData.floating_footer_instagram_url} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_instagram_url: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="https://instagram.com/your_account"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Footer 텍스트</label><input type="text" value={footerBarData.floating_footer_text} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_text: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="© 회사명 Co.,Ltd."/></div>
            </div>
          </div>
          <div className="border-b border-gray-300 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Footer Bar 스타일</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">폰트</label><input type="text" value={footerBarData.floating_footer_font} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_font: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Pretendard"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">폰트 크기 (px)</label><input type="number" value={footerBarData.floating_footer_font_size} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_font_size: Number(e.target.value)}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" min={8} max={20}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">폰트 컬러</label><div className="flex gap-2"><input type="color" value={footerBarData.floating_footer_font_color} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_font_color: e.target.value}))} className="h-10 w-14 cursor-pointer rounded border"/><input type="text" value={footerBarData.floating_footer_font_color} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_font_color: e.target.value}))} className="flex-1 px-3 py-2 border rounded-lg outline-none text-sm"/></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">상하 여백 (px)</label><input type="number" value={footerBarData.floating_footer_padding_y} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_padding_y: Number(e.target.value)}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" min={0} max={40}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">좌우 여백 (px)</label><input type="number" value={footerBarData.floating_footer_padding_x} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_padding_x: Number(e.target.value)}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" min={0} max={60}/></div>
            </div>
          </div>
          <div className="border-b border-gray-300 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Terms & Conditions</h3>
            <textarea value={footerBarData.floating_footer_terms_content} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_terms_content: e.target.value}))} rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-y font-mono text-sm" placeholder="이용약관 내용을 입력하세요..."/>
          </div>
          <div className="border-b border-gray-300 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Guide</h3>
            <textarea value={footerBarData.floating_footer_guide_content} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_guide_content: e.target.value}))} rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-y font-mono text-sm" placeholder="이용안내 내용을 입력하세요..."/>
          </div>
          <div className="border-b border-gray-300 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Privacy Policy</h3>
            <textarea value={footerBarData.floating_footer_privacy_content} onChange={e => setFooterBarData(prev => ({...prev, floating_footer_privacy_content: e.target.value}))} rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-y font-mono text-sm" placeholder="개인정보처리방침 내용을 입력하세요..."/>
          </div>
          <button onClick={handleSaveFooterBar} disabled={saving} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"><Save size={18} />{saving ? 'Saving...' : 'Save Footer Bar Settings'}</button>
        </div>
      )}

      {activeTab === 'general' && (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding Section */}
        <div className="border-b border-gray-300 pb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Branding & Identity</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label><input type="text" name="brand_name" value={formData.brand_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 로고 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Image <span className="text-xs text-gray-400">(풀 로고)</span></label>
                <div className="flex gap-3 items-start">
                  <label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2 text-sm">
                    <Upload size={16} /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {formData.logo_url && (
                    <>
                      <button type="button" onClick={handleRemoveLogo} className="px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg flex items-center gap-1 text-sm"><X size={14} /></button>
                      <img src={formData.logo_url} className="h-10 object-contain border border-gray-200 rounded" />
                    </>
                  )}
                </div>
              </div>
              {/* 심볼 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Symbol Image <span className="text-xs text-gray-400">(스크롤 시 축소 로고)</span></label>
                <div className="flex gap-3 items-start">
                  <label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2 text-sm">
                    <Upload size={16} /> {uploadingSymbol ? 'Uploading...' : 'Upload Symbol'}
                    <input type="file" accept="image/*" onChange={handleSymbolUpload} className="hidden" />
                  </label>
                  {formData.symbol_url && (
                    <>
                      <button type="button" onClick={handleRemoveSymbol} className="px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg flex items-center gap-1 text-sm"><X size={14} /></button>
                      <img src={formData.symbol_url} className="h-10 object-contain border border-gray-200 rounded" />
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">미등록 시 풀 로고가 축소되어 표시됩니다</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Width</label>
                <input type="text" name="logo_width" value={formData.logo_width} onChange={handleLogoWidthChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="예: 120px"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Symbol Size (px) <span className="text-xs text-gray-400">— 스크롤 후 심볼 높이</span></label>
                <input type="number" value={formData.symbol_size} onChange={e => setFormData(prev => ({...prev, symbol_size: Number(e.target.value)}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" min={16} max={80}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Padding Top (px)</label>
                <input type="number" value={formData.logo_padding_top} onChange={e => setFormData(prev => ({...prev, logo_padding_top: Number(e.target.value)}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" min={0} max={60}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Padding Bottom (px)</label>
                <input type="number" value={formData.logo_padding_bottom} onChange={e => setFormData(prev => ({...prev, logo_padding_bottom: Number(e.target.value)}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" min={0} max={60}/>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label><input type="text" name="site_title" value={formData.site_title} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"/></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
              <div className="flex gap-3 items-start"><label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2"><Upload size={16} /> Upload Favicon<input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" /></label>{formData.favicon_url && <div className="flex-1"><img src={formData.favicon_url} className="h-8 w-8 object-contain border border-gray-200 rounded" /></div>}</div>
            </div>
          </div>
        </div>

        {/* Announcement Bar Section */}
        <div className="border-b border-gray-300 pb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO & Share Preview</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Footer Content</label>
              <textarea
                name="footer_content"
                value={formData.footer_content}
                onChange={handleInputChange}
                rows={4}
                placeholder="회사명, 사업자 정보, 문의처 등을 입력하세요."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shared Link Title</label>
              <input type="text" name="share_title" value={formData.share_title} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="카카오톡/소셜 공유 제목" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shared Link Description</label>
              <textarea
                name="share_description"
                value={formData.share_description}
                onChange={handleInputChange}
                rows={3}
                placeholder="카카오톡/소셜 공유 설명"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shared Link Image</label>
              <div className="flex gap-3 items-start">
                <label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2">
                  <Upload size={16} /> {uploadingShareImage ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleShareImageUpload} className="hidden" />
                </label>
                {formData.share_image_url && (
                  <>
                    <button type="button" onClick={handleRemoveShareImage} className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg flex items-center gap-2">
                      <X size={16} /> Remove
                    </button>
                    <div className="flex-1">
                      <img src={formData.share_image_url} className="h-16 object-cover border border-gray-200 rounded" />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kakao JavaScript Key</label>
              <input
                type="text"
                name="kakao_js_key"
                value={formData.kakao_js_key}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                placeholder="카카오톡 공유용 JavaScript 키"
              />
              <p className="text-xs text-gray-400 mt-1">카카오톡 공유 기능을 사용하려면 JavaScript 키를 입력하세요.</p>
            </div>
          </div>
        </div>

        {/* Announcement Bar Section */}
        <div className="border-b border-gray-300 pb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Announcement Bar</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Text</label><textarea name="announcement_text" value={formData.announcement_text} onChange={handleInputChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none"/></div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label><div className="flex gap-3"><input type="color" name="announcement_bg_color" value={formData.announcement_bg_color} onChange={handleInputChange} className="w-16 h-10 border rounded cursor-pointer"/><input type="text" name="announcement_bg_color" value={formData.announcement_bg_color} onChange={handleInputChange} className="flex-1 px-4 py-2 border rounded-lg outline-none"/></div></div>
               <div><label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label><div className="flex gap-3"><input type="color" name="announcement_text_color" value={formData.announcement_text_color} onChange={handleInputChange} className="w-16 h-10 border rounded cursor-pointer"/><input type="text" name="announcement_text_color" value={formData.announcement_text_color} onChange={handleInputChange} className="flex-1 px-4 py-2 border rounded-lg outline-none"/></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="block text-sm font-medium text-gray-700 mb-2">Height (px)</label><input type="number" name="announcement_height" value={formData.announcement_height} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none"/></div>
               <div><label className="block text-sm font-medium text-gray-700 mb-2">Speed (sec)</label><input type="number" name="announcement_speed" value={formData.announcement_speed} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none"/></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Width Type</label><select name="announcement_width_type" value={formData.announcement_width_type} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none"><option value="FULL">Full Width</option><option value="FIXED">Fixed Width</option></select></div>
          </div>
        </div>

        {/* Design & Theme Section */}
        <div className="border-t border-gray-300 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Design & Theme</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Banner Height</label><input type="number" name="banner_height" value={formData.banner_height} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Canvas Height</label><input type="number" name="canvas_height" value={formData.canvas_height} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none"/></div>
            
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label><div className="flex gap-3"><input type="color" name="bg_color" value={formData.bg_color} onChange={handleInputChange} className="w-16 h-10 border rounded cursor-pointer" /><input type="text" name="bg_color" value={formData.bg_color} onChange={handleInputChange} className="flex-1 px-4 py-2 border rounded-lg outline-none" /></div></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu & Navigation Text Color</label>
              <div className="flex gap-3 items-center">
                <input type="color" name="nav_text_color" value={formData.nav_text_color} onChange={handleInputChange} className="w-16 h-10 border border-gray-300 rounded cursor-pointer" />
                <input type="text" name="nav_text_color" value={formData.nav_text_color} onChange={handleInputChange} placeholder="#FFFFFF" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none font-mono" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Color for header menu and category tabs</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Background Color</label>
              <div className="flex gap-3 items-center">
                <input type="color" name="header_bg_color" value={formData.header_bg_color || '#000000'} onChange={handleInputChange} className="w-16 h-10 border border-gray-300 rounded cursor-pointer" />
                <input type="text" name="header_bg_color" value={formData.header_bg_color} onChange={handleInputChange} placeholder="비우면 투명" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none font-mono" />
              </div>
              <p className="text-xs text-gray-500 mt-1">비워두면 투명 배경, 색상 입력 시 해당 색 적용</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
              <select name="font_family" value={formData.font_family} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="JetBrains Mono">JetBrains Mono (Tech look)</option>
                <option value="Inter">Inter (Clean, Modern)</option>
                <option value="Roboto">Roboto (Standard)</option>
                <option value="Diatype">Diatype (Modern)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="is_maintenance_mode" checked={formData.is_maintenance_mode} onChange={handleInputChange} className="w-5 h-5 cursor-pointer"/><span className="text-sm font-medium text-gray-700">Maintenance Mode</span></label></div>
        <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"><Save size={18} />{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
      )}
    </div>
  );
};