import { useState, useEffect } from 'react';
import { Save, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const SiteSettingsForm = () => {
  const { settings, refreshSettings } = useSiteSettings();
  
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
    accent_color: '#34d399',
    bg_color: '#000000',
    font_family: 'JetBrains Mono',
    logo_url: '',
    logo_width: '120px',
    favicon_url: '',
    site_title: 'My Store',
    banner_height: 400,
    nav_text_color: '#FFFFFF',
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

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
        accent_color: settings.product_accent_color || settings.accent_color || '#34d399',
        bg_color: settings.bg_color || '#000000',
        font_family: settings.font_family || 'JetBrains Mono',
        logo_url: settings.logo_url || '',
        logo_width: settings.logo_width || '120px',
        favicon_url: settings.favicon_url || '',
        site_title: settings.site_title || 'My Store',
        banner_height: settings.banner_height || 400,
        nav_text_color: settings.nav_text_color || '#FFFFFF',
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

  const handleRemoveLogo = () => { setFormData(prev => ({ ...prev, logo_url: '' })); setMessage('Logo removed.'); };
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
          
          product_accent_color: formData.accent_color,
          accent_color: formData.accent_color,
          
          bg_color: formData.bg_color,
          font_family: formData.font_family,
          logo_url: formData.logo_url,
          logo_width: formData.logo_width,
          favicon_url: formData.favicon_url,
          site_title: formData.site_title,
          banner_height: formData.banner_height,
          nav_text_color: formData.nav_text_color,
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

  return (
    <div className="space-y-6">
      {message && <div className={`px-4 py-3 border rounded-lg ${message.includes('Failed') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}><p className="text-sm">{message}</p></div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding Section */}
        <div className="border-b border-gray-300 pb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Branding & Identity</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label><input type="text" name="brand_name" value={formData.brand_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"/></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Image</label>
              <div className="flex gap-3 items-start">
                <label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2"><Upload size={16} /> Upload Logo<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label>
                {formData.logo_url && <><button type="button" onClick={handleRemoveLogo} className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg flex items-center gap-2"><X size={16} /> Remove</button><div className="flex-1"><img src={formData.logo_url} className="h-12 object-contain border border-gray-200 rounded" /></div></>}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Logo Width</label><input type="text" name="logo_width" value={formData.logo_width} onChange={handleLogoWidthChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label><input type="text" name="site_title" value={formData.site_title} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"/></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
              <div className="flex gap-3 items-start"><label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2"><Upload size={16} /> Upload Favicon<input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" /></label>{formData.favicon_url && <div className="flex-1"><img src={formData.favicon_url} className="h-8 w-8 object-contain border border-gray-200 rounded" /></div>}</div>
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
            
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label><div className="flex gap-3"><input type="color" name="bg_color" value={formData.bg_color} onChange={handleInputChange} className="w-16 h-10 border rounded cursor-pointer" /><input type="text" name="bg_color" value={formData.bg_color} onChange={handleInputChange} className="flex-1 px-4 py-2 border rounded-lg outline-none" /></div></div>
                
                {/* 엑센트 컬러 설정 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color (Neon)</label>
                  <div className="flex gap-3">
                    <input type="color" name="accent_color" value={formData.accent_color} onChange={handleInputChange} className="w-16 h-10 border rounded cursor-pointer" />
                    <input type="text" name="accent_color" value={formData.accent_color} onChange={handleInputChange} className="flex-1 px-4 py-2 border rounded-lg outline-none" />
                  </div>
                </div>
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
    </div>
  );
};
