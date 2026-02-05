import { useState, useEffect } from 'react';
import { Upload, X, Save, Palette, Type } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ConfigTab = 'BUILDER' | 'SHOP' | 'STYLE';

interface Category {
  id: string;
  name: string;
  slug: string;
  section: 'SHOP' | 'BUILDER';
}

export const MainPageManager = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('BUILDER');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  // 카테고리 & 배너 설정
  const [builderSelected, setBuilderSelected] = useState<string[]>([]);
  const [shopSelected, setShopSelected] = useState<string[]>([]);
  const [builderBannerImages, setBuilderBannerImages] = useState<string[]>([]);
  const [shopBannerImages, setShopBannerImages] = useState<string[]>([]);
  
  // 배너 옵션
  const [builderBannerTransition, setBuilderBannerTransition] = useState('slide');
  const [builderBannerSpeed, setBuilderBannerSpeed] = useState(3000);
  const [shopBannerTransition, setShopBannerTransition] = useState('slide');
  const [shopBannerSpeed, setShopBannerSpeed] = useState(3000);

  // 디자인 설정
  const [productCardBg, setProductCardBg] = useState('#000000');
  const [productTextColor, setProductTextColor] = useState('#FFFFFF');
  const [productSubTextColor, setProductSubTextColor] = useState('#9CA3AF');
  const [productAccentColor, setProductAccentColor] = useState('#34D399');
  const [productNameSize, setProductNameSize] = useState(16);
  const [productCategorySize, setProductCategorySize] = useState(12);
  const [productPriceSize, setProductPriceSize] = useState(14);

  // 파일 업로드
  const [builderBannerFiles, setBuilderBannerFiles] = useState<File[]>([]);
  const [builderBannerPreviewUrls, setBuilderBannerPreviewUrls] = useState<string[]>([]);
  const [shopBannerFiles, setShopBannerFiles] = useState<File[]>([]);
  const [shopBannerPreviewUrls, setShopBannerPreviewUrls] = useState<string[]>([]);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    await fetchCategories();
    await fetchSettings();
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, slug, section').eq('is_hidden', false).order('display_order', { ascending: true });
    setCategories(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (!data) return;

    setBuilderSelected(Array.isArray(data.builder_home_categories) ? data.builder_home_categories.map(String) : []);
    setShopSelected(Array.isArray(data.shop_home_categories) ? data.shop_home_categories.map(String) : []);
    setBuilderBannerImages(data.builder_banner_images || []);
    setShopBannerImages(data.shop_banner_images || []);
    
    setBuilderBannerTransition(data.builder_banner_transition || 'slide');
    setBuilderBannerSpeed(data.builder_banner_speed || 3000);
    setShopBannerTransition(data.shop_banner_transition || 'slide');
    setShopBannerSpeed(data.shop_banner_speed || 3000);

    setProductCardBg(data.product_card_bg || '#000000');
    setProductTextColor(data.product_text_color || '#FFFFFF');
    setProductSubTextColor(data.product_sub_text_color || '#9CA3AF');
    setProductAccentColor(data.product_accent_color || '#34D399');
    setProductNameSize(data.product_name_size || 16);
    setProductCategorySize(data.product_category_size || 12);
    setProductPriceSize(data.product_price_size || 14);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `public/${Date.now()}_${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleBuilderBannerFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setBuilderBannerFiles(files);
      setBuilderBannerPreviewUrls(files.map(f => URL.createObjectURL(f)));
    }
  };
  
  const handleShopBannerFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setShopBannerFiles(files);
      setShopBannerPreviewUrls(files.map(f => URL.createObjectURL(f)));
    }
  };

  const toggleCategory = (id: string, type: 'BUILDER' | 'SHOP') => {
    const setter = type === 'BUILDER' ? setBuilderSelected : setShopSelected;
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async (type: 'BUILDER' | 'SHOP' | 'STYLE') => {
    setUploading(true);
    setMessage('');
    try {
      let updateData: any = {};

      if (type === 'BUILDER') {
        let newImages = [...builderBannerImages];
        for (const file of builderBannerFiles) {
          const url = await uploadImage(file);
          if (url) newImages.push(url);
        }
        updateData = {
          builder_home_categories: builderSelected,
          builder_banner_images: newImages,
          builder_banner_transition: builderBannerTransition,
          builder_banner_speed: builderBannerSpeed
        };
        setBuilderBannerImages(newImages);
        setBuilderBannerFiles([]);
        setBuilderBannerPreviewUrls([]);
      } else if (type === 'SHOP') {
        let newImages = [...shopBannerImages];
        for (const file of shopBannerFiles) {
          const url = await uploadImage(file);
          if (url) newImages.push(url);
        }
        updateData = {
          shop_home_categories: shopSelected,
          shop_banner_images: newImages,
          shop_banner_transition: shopBannerTransition,
          shop_banner_speed: shopBannerSpeed
        };
        setShopBannerImages(newImages);
        setShopBannerFiles([]);
        setShopBannerPreviewUrls([]);
      } else if (type === 'STYLE') {
        updateData = {
          product_card_bg: productCardBg,
          product_text_color: productTextColor,
          product_sub_text_color: productSubTextColor,
          product_accent_color: productAccentColor,
          product_name_size: productNameSize,
          product_category_size: productCategorySize,
          product_price_size: productPriceSize
        };
      }

      const { error } = await supabase.from('site_settings').update(updateData).eq('id', 1);
      if (error) throw error;
      setMessage('✅ Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Failed to save: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    // ✅ [수정됨] 스크롤 가능하도록 높이 및 overflow 설정 추가 (pb-32로 하단 여백 확보)
    <div className="h-full overflow-y-auto pb-32 px-1">
      <div className="mb-6 sticky top-0 bg-white z-10 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Main Page & Design Manager</h3>
      </div>

      {message && <div className={`mb-4 px-4 py-3 rounded-lg ${message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>{message}</div>}

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {['BUILDER', 'SHOP', 'STYLE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as ConfigTab)}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab === 'STYLE' ? 'PRODUCT STYLE' : `${tab} CONFIG`}
          </button>
        ))}
      </div>

      {(activeTab === 'BUILDER' || activeTab === 'SHOP') && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div>
            <label className="block font-medium mb-2">Banner Images</label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(activeTab === 'BUILDER' ? builderBannerImages : shopBannerImages).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} className="w-full h-32 object-cover rounded border" />
                  <button onClick={() => {
                    if(activeTab === 'BUILDER') setBuilderBannerImages(prev => prev.filter((_, idx) => idx !== i));
                    else setShopBannerImages(prev => prev.filter((_, idx) => idx !== i));
                  }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={14}/></button>
                </div>
              ))}
            </div>
            <input type="file" multiple onChange={activeTab === 'BUILDER' ? handleBuilderBannerFilesChange : handleShopBannerFilesChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Transition Effect</label>
              <select 
                value={activeTab === 'BUILDER' ? builderBannerTransition : shopBannerTransition} 
                onChange={(e) => activeTab === 'BUILDER' ? setBuilderBannerTransition(e.target.value) : setShopBannerTransition(e.target.value)} 
                className="w-full border rounded p-2"
              >
                <option value="slide">Slide (슬라이드)</option>
                <option value="fade">Fade (페이드)</option>
                <option value="zoom">Zoom (확대)</option>
                <option value="blur">Blur (블러)</option>
                <option value="flip">Flip (회전)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Speed (ms)</label>
              <input type="number" value={activeTab === 'BUILDER' ? builderBannerSpeed : shopBannerSpeed} onChange={(e) => activeTab === 'BUILDER' ? setBuilderBannerSpeed(Number(e.target.value)) : setShopBannerSpeed(Number(e.target.value))} className="w-full border rounded p-2" />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">Categories</label>
            <div className="border rounded p-4 max-h-60 overflow-y-auto space-y-2">
              {categories.filter(c => c.section === activeTab).map(c => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(activeTab === 'BUILDER' ? builderSelected : shopSelected).includes(String(c.id))} onChange={() => toggleCategory(String(c.id), activeTab as 'BUILDER' | 'SHOP')} className="rounded text-blue-600" />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <button onClick={() => handleSave(activeTab)} disabled={uploading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">{uploading ? 'Saving...' : `Save ${activeTab} Config`}</button>
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
          <div>
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><Type size={18}/> Font Sizes (px)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="block text-sm font-medium mb-1">Name Size</label><input type="number" value={productNameSize} onChange={(e) => setProductNameSize(Number(e.target.value))} className="border rounded px-3 py-2 w-full" /></div>
              <div><label className="block text-sm font-medium mb-1">Category Size</label><input type="number" value={productCategorySize} onChange={(e) => setProductCategorySize(Number(e.target.value))} className="border rounded px-3 py-2 w-full" /></div>
              <div><label className="block text-sm font-medium mb-1">Price Size</label><input type="number" value={productPriceSize} onChange={(e) => setProductPriceSize(Number(e.target.value))} className="border rounded px-3 py-2 w-full" /></div>
            </div>
          </div>
          
           {/* Preview Section */}
           <div className="p-6 bg-gray-100 rounded-xl">
            <p className="text-sm text-gray-500 mb-4 font-bold uppercase">Preview</p>
            <div className="w-48 p-3 rounded border border-white/20" style={{ backgroundColor: productCardBg }}>
              <div className="font-bold mb-1" style={{ color: productTextColor, fontSize: `${productNameSize}px` }}>Sample Product</div>
              <div className="uppercase tracking-wider mb-2" style={{ color: productSubTextColor, fontSize: `${productCategorySize}px` }}>CATEGORY</div>
              <div className="aspect-square bg-zinc-900 rounded mb-2 flex items-center justify-center text-gray-600 text-xs">IMAGE</div>
              <div className="font-semibold" style={{ color: productAccentColor, fontSize: `${productPriceSize}px` }}>₩15,000</div>
            </div>
          </div>

          <button onClick={() => handleSave('STYLE')} disabled={uploading} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">{uploading ? 'Saving...' : 'Save Design Settings'}</button>
        </div>
      )}
    </div>
  );
};