import { useState, useEffect } from 'react';
import { Upload, X, Palette, Type, Image as ImageIcon, Link as LinkIcon, Layout, Settings, Monitor, Columns } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ConfigTab = 'BUILDER' | 'SHOP' | 'STYLE' | 'GLOBAL';

interface Category { id: string; name: string; slug: string; section: 'SHOP' | 'BUILDER'; }

export const MainPageManager = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('SHOP');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // 1. 빌더 설정
  const [builderSelected, setBuilderSelected] = useState<string[]>([]);
  const [builderBannerImages, setBuilderBannerImages] = useState<string[]>([]);
  const [builderBannerTransition, setBuilderBannerTransition] = useState('slide');
  const [builderBannerSpeed, setBuilderBannerSpeed] = useState(3000);
  const [canvasBgColor, setCanvasBgColor] = useState('#FFFFFF');
  const [canvasBgImage, setCanvasBgImage] = useState('');

  // 2. 샵 설정 (개편됨: 3개의 독립 슬롯)
  const [shopSelected, setShopSelected] = useState<string[]>([]);
  const [slot1Images, setSlot1Images] = useState<string[]>([]);
  const [slot2Images, setSlot2Images] = useState<string[]>([]);
  const [slot3Images, setSlot3Images] = useState<string[]>([]);
  // 공통 슬라이드 설정
  const [shopBannerTransition, setShopBannerTransition] = useState('slide');
  const [shopBannerSpeed, setShopBannerSpeed] = useState(3000);

  // 3. 디자인
  const [productCardBg, setProductCardBg] = useState('#000000');
  const [productTextColor, setProductTextColor] = useState('#FFFFFF');
  const [productSubTextColor, setProductSubTextColor] = useState('#9CA3AF');
  const [productAccentColor, setProductAccentColor] = useState('#34D399');
  const [productNameSize, setProductNameSize] = useState(16);
  const [productCategorySize, setProductCategorySize] = useState(12);
  const [productPriceSize, setProductPriceSize] = useState(14);

  // 4. 전역 스타일
  const [globalBgColor, setGlobalBgColor] = useState('#000000');
  const [globalTextColor, setGlobalTextColor] = useState('#FFFFFF');
  const [layoutBorderColor, setLayoutBorderColor] = useState('#FFFFFF');
  const [layoutBorderOpacity, setLayoutBorderOpacity] = useState(0.3);

  // 파일 업로드 임시 저장소
  const [builderBannerFiles, setBuilderBannerFiles] = useState<File[]>([]);
  const [slot1Files, setSlot1Files] = useState<File[]>([]);
  const [slot2Files, setSlot2Files] = useState<File[]>([]);
  const [slot3Files, setSlot3Files] = useState<File[]>([]);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => { await fetchCategories(); await fetchSettings(); };
  const fetchCategories = async () => { const { data } = await supabase.from('categories').select('id, name, slug, section').eq('is_hidden', false).order('display_order', { ascending: true }); setCategories(data || []); };

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (!data) return;

    setBuilderSelected(Array.isArray(data.builder_home_categories) ? data.builder_home_categories.map(String) : []);
    setBuilderBannerImages(data.builder_banner_images || []);
    setBuilderBannerTransition(data.builder_banner_transition || 'slide');
    setBuilderBannerSpeed(data.builder_banner_speed || 3000);
    setCanvasBgColor(data.canvas_bg_color || '#FFFFFF');
    setCanvasBgImage(data.canvas_bg_image || '');

    // ✅ SHOP 슬롯 데이터 로드
    setShopSelected(Array.isArray(data.shop_home_categories) ? data.shop_home_categories.map(String) : []);
    setSlot1Images(data.shop_slot1_images || []);
    setSlot2Images(data.shop_slot2_images || []);
    setSlot3Images(data.shop_slot3_images || []);
    setShopBannerTransition(data.shop_banner_transition || 'slide');
    setShopBannerSpeed(data.shop_banner_speed || 3000);

    setProductCardBg(data.product_card_bg || '#000000');
    setProductTextColor(data.product_text_color || '#FFFFFF');
    setProductSubTextColor(data.product_sub_text_color || '#9CA3AF');
    setProductAccentColor(data.product_accent_color || '#34D399');
    setProductNameSize(data.product_name_size || 16);
    setProductCategorySize(data.product_category_size || 12);
    setProductPriceSize(data.product_price_size || 14);

    setGlobalBgColor(data.global_bg_color || '#000000');
    setGlobalTextColor(data.global_text_color || '#FFFFFF');
    setLayoutBorderColor(data.layout_border_color || '#FFFFFF');
    setLayoutBorderOpacity(data.layout_border_opacity ?? 0.3);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `public/${Date.now()}_${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        const url = await uploadImage(e.target.files[0]);
        setter(url);
      } catch (error) { console.error(error); alert('Upload failed'); } finally { setUploading(false); }
    }
  };

  const handleSave = async (type: ConfigTab) => {
    setUploading(true);
    setMessage('');
    try {
      let updateData: any = {};

      if (type === 'BUILDER') {
        let newImages = [...builderBannerImages];
        for (const file of builderBannerFiles) { const url = await uploadImage(file); if (url) newImages.push(url); }
        updateData = { 
          builder_home_categories: builderSelected, 
          builder_banner_images: newImages, 
          builder_banner_transition: builderBannerTransition, 
          builder_banner_speed: builderBannerSpeed,
          canvas_bg_color: canvasBgColor,
          canvas_bg_image: canvasBgImage
        };
        setBuilderBannerImages(newImages); setBuilderBannerFiles([]);
      } else if (type === 'SHOP') {
        // ✅ 3개 슬롯 이미지 각각 처리
        let newSlot1 = [...slot1Images];
        for (const file of slot1Files) { const url = await uploadImage(file); if (url) newSlot1.push(url); }
        
        let newSlot2 = [...slot2Images];
        for (const file of slot2Files) { const url = await uploadImage(file); if (url) newSlot2.push(url); }
        
        let newSlot3 = [...slot3Images];
        for (const file of slot3Files) { const url = await uploadImage(file); if (url) newSlot3.push(url); }

        updateData = { 
          shop_home_categories: shopSelected, 
          shop_slot1_images: newSlot1,
          shop_slot2_images: newSlot2,
          shop_slot3_images: newSlot3,
          shop_banner_transition: shopBannerTransition, 
          shop_banner_speed: shopBannerSpeed,
        };
        setSlot1Images(newSlot1); setSlot1Files([]);
        setSlot2Images(newSlot2); setSlot2Files([]);
        setSlot3Images(newSlot3); setSlot3Files([]);
      } else if (type === 'STYLE') {
        updateData = { product_card_bg: productCardBg, product_text_color: productTextColor, product_sub_text_color: productSubTextColor, product_accent_color: productAccentColor, product_name_size: productNameSize, product_category_size: productCategorySize, product_price_size: productPriceSize };
      } else if (type === 'GLOBAL') {
        updateData = { global_bg_color: globalBgColor, global_text_color: globalTextColor, layout_border_color: layoutBorderColor, layout_border_opacity: layoutBorderOpacity };
      }

      const { error } = await supabase.from('site_settings').update(updateData).eq('id', 1);
      if (error) throw error;
      setMessage('✅ Settings saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) { console.error(err); setMessage(`❌ Save failed: ${err.message}`); } finally { setUploading(false); }
  };

  // 슬롯 관리 UI 렌더링 헬퍼
  const renderSlotManager = (title: string, images: string[], setImages: any, setFiles: any) => (
    <div className="border p-4 rounded bg-gray-50 mb-4">
      <h5 className="font-bold mb-3 text-sm uppercase text-gray-600">{title}</h5>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {images.map((url, i) => (
          <div key={i} className="relative group aspect-square">
            <img src={url} className="w-full h-full object-cover rounded border" />
            <button onClick={() => setImages((prev:string[]) => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={12}/></button>
          </div>
        ))}
      </div>
      <input type="file" multiple onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} className="block w-full text-xs text-gray-500"/>
    </div>
  );

  return (
    <div>
      <div className="mb-6"><h3 className="text-lg font-semibold text-gray-800">Main Page & Design Manager</h3></div>
      {message && <div className={`mb-4 px-4 py-3 rounded-lg ${message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>{message}</div>}

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {['SHOP', 'BUILDER', 'STYLE', 'GLOBAL'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as ConfigTab)} className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
            {tab === 'STYLE' ? 'PRODUCT STYLE' : tab === 'GLOBAL' ? 'GLOBAL STYLE' : `${tab} CONFIG`}
          </button>
        ))}
      </div>

      {activeTab === 'SHOP' && (
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Columns size={18}/> 3-Column Banner Sliders</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderSlotManager("Slot 1 (Left)", slot1Images, setSlot1Images, setSlot1Files)}
              {renderSlotManager("Slot 2 (Center)", slot2Images, setSlot2Images, setSlot2Files)}
              {renderSlotManager("Slot 3 (Right)", slot3Images, setSlot3Images, setSlot3Files)}
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mt-4">
              <div><label className="block text-sm font-medium mb-1">Transition Effect</label><select value={shopBannerTransition} onChange={(e) => setShopBannerTransition(e.target.value)} className="w-full border rounded p-2"><option value="slide">Slide</option><option value="fade">Fade</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Slide Speed (ms)</label><input type="number" value={shopBannerSpeed} onChange={(e) => setShopBannerSpeed(Number(e.target.value))} className="w-full border rounded p-2" /></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Layout size={18}/> Shop Bottom Categories</h4>
            <div className="border rounded p-4 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">{categories.filter(c => c.section === 'SHOP').map(c => (<label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"><input type="checkbox" checked={shopSelected.includes(String(c.id))} onChange={() => setShopSelected(prev => prev.includes(String(c.id)) ? prev.filter(x => x !== String(c.id)) : [...prev, String(c.id)])} className="w-4 h-4 rounded text-blue-600" /><span className="text-sm font-medium">{c.name}</span></label>))}</div>
          </div>
          <button onClick={() => handleSave('SHOP')} disabled={uploading} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full font-bold text-lg">{uploading ? 'Saving...' : 'Save SHOP Config'}</button>
        </div>
      )}

      {/* BUILDER, STYLE, GLOBAL 탭은 기존 코드 유지 */}
      {activeTab === 'BUILDER' && (
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon size={18}/> Builder Main Banners</h4>
            <div className="grid grid-cols-4 gap-3 mb-4">{builderBannerImages.map((url, i) => (<div key={i} className="relative group aspect-video"><img src={url} className="w-full h-full object-cover rounded border" /><button onClick={() => setBuilderBannerImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={14}/></button></div>))}</div>
            <input type="file" multiple onChange={(e) => e.target.files && setBuilderBannerFiles(Array.from(e.target.files))} className="block w-full text-sm text-gray-500 mb-4"/>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg"><div><label className="block text-sm font-medium mb-1">Transition</label><select value={builderBannerTransition} onChange={(e) => setBuilderBannerTransition(e.target.value)} className="w-full border rounded p-2"><option value="slide">Slide</option><option value="fade">Fade</option></select></div><div><label className="block text-sm font-medium mb-1">Speed (ms)</label><input type="number" value={builderBannerSpeed} onChange={(e) => setBuilderBannerSpeed(Number(e.target.value))} className="w-full border rounded p-2" /></div></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Monitor size={18}/> Drop Zone (Canvas) Style</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium mb-1">Background Color</label><div className="flex gap-2"><input type="color" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Background Image</label><div className="mb-2 h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden border">{canvasBgImage ? <img src={canvasBgImage} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">No Image</span>}</div><div className="flex gap-2"><input type="file" onChange={(e) => handleSingleImageUpload(e, setCanvasBgImage)} className="block w-full text-xs text-gray-500"/>{canvasBgImage && <button onClick={() => setCanvasBgImage('')} className="bg-red-50 text-red-500 px-2 rounded text-xs border border-red-200">Delete</button>}</div></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Layout size={18}/> Builder Home Categories</h4>
            <div className="border rounded p-4 max-h-60 overflow-y-auto grid grid-cols-2 gap-2">{categories.filter(c => c.section === 'BUILDER').map(c => (<label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"><input type="checkbox" checked={builderSelected.includes(String(c.id))} onChange={() => setBuilderSelected(prev => prev.includes(String(c.id)) ? prev.filter(x => x !== String(c.id)) : [...prev, String(c.id)])} className="w-4 h-4 rounded text-blue-600" /><span className="text-sm font-medium">{c.name}</span></label>))}</div>
          </div>
          <button onClick={() => handleSave('BUILDER')} disabled={uploading} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full font-bold text-lg">{uploading ? 'Saving...' : 'Save BUILDER Config'}</button>
        </div>
      )}

      {activeTab === 'STYLE' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-8">
          <div>
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><Palette size={18}/> Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium mb-1">Card Background</label><div className="flex gap-2"><input type="color" value={productCardBg} onChange={(e) => setProductCardBg(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={productCardBg} onChange={(e) => setProductCardBg(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Product Name Color</label><div className="flex gap-2"><input type="color" value={productTextColor} onChange={(e) => setProductTextColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={productTextColor} onChange={(e) => setProductTextColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Category Color</label><div className="flex gap-2"><input type="color" value={productSubTextColor} onChange={(e) => setProductSubTextColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={productSubTextColor} onChange={(e) => setProductSubTextColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Accent (Price) Color</label><div className="flex gap-2"><input type="color" value={productAccentColor} onChange={(e) => setProductAccentColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={productAccentColor} onChange={(e) => setProductAccentColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
            </div>
          </div>
          <button onClick={() => handleSave('STYLE')} disabled={uploading} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 w-full font-bold text-lg">{uploading ? 'Saving...' : 'Save Design Settings'}</button>
        </div>
      )}

      {activeTab === 'GLOBAL' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-8">
          <div>
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><Settings size={18}/> Global Page Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium mb-1">Global Background Color</label><div className="flex gap-2"><input type="color" value={globalBgColor} onChange={(e) => setGlobalBgColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={globalBgColor} onChange={(e) => setGlobalBgColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Global Font Color</label><div className="flex gap-2"><input type="color" value={globalTextColor} onChange={(e) => setGlobalTextColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={globalTextColor} onChange={(e) => setGlobalTextColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Layout Border Color</label><div className="flex gap-2"><input type="color" value={layoutBorderColor} onChange={(e) => setLayoutBorderColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={layoutBorderColor} onChange={(e) => setLayoutBorderColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Border Opacity (0.0 ~ 1.0)</label><input type="number" step="0.1" min="0" max="1" value={layoutBorderOpacity} onChange={(e) => setLayoutBorderOpacity(Number(e.target.value))} className="border rounded px-3 py-2 w-full"/></div>
            </div>
          </div>
          <button onClick={() => handleSave('GLOBAL')} disabled={uploading} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 w-full font-bold text-lg">{uploading ? 'Saving...' : 'Save GLOBAL Styles'}</button>
        </div>
      )}
    </div>
  );
};