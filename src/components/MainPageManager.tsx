import { useState, useEffect } from 'react';
import { X, Palette, Image as ImageIcon, Layout, Settings, Monitor } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ConfigTab = 'MAIN' | 'STYLE' | 'DETAIL' | 'GLOBAL';

interface Category { id: string; name: string; slug: string; section: 'SHOP' | 'BUILDER'; }

const FONT_OPTIONS = [
  { value: 'Pretendard', label: 'Pretendard (프리텐다드) — 모던 한글' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR — 기본 한글' },
  { value: 'Nanum Gothic', label: '나눔고딕 — 둥근 한글' },
  { value: 'Nanum Myeongjo', label: '나눔명조 — 세리프 한글' },
  { value: 'Black Han Sans', label: '검은고딕 — 강렬한 한글' },
  { value: 'Jua', label: '주아 — 귀여운 한글' },
  { value: 'Inter', label: 'Inter — 깔끔한 UI' },
  { value: 'Space Grotesk', label: 'Space Grotesk — 힙한 그로테스크' },
  { value: 'DM Sans', label: 'DM Sans — 세련된 산세리프' },
  { value: 'Syne', label: 'Syne — 에디토리얼 힙' },
  { value: 'Bebas Neue', label: 'Bebas Neue — 강렬한 올캡스' },
  { value: 'Unbounded', label: 'Unbounded — 미래적 디자인' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono — 모노스페이스' },
  { value: 'Roboto', label: 'Roboto — 구글 표준' },
];

const FontSection = ({ label, bg, children }: { label: string; bg?: string; children: React.ReactNode }) => (
  <div className={`border rounded-lg p-4 ${bg || 'bg-gray-50'}`}>
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{label}</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
  </div>
);
const SizeInput = ({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
  <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label><input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="border rounded px-3 py-2 w-full text-sm" min={min} max={max}/></div>
);
const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div><label className="block text-xs font-medium text-gray-600 mb-1">{label} <span className="text-gray-400 font-normal">(비우면 기본)</span></label>
    <div className="flex gap-2 items-center">
      <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border"/>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="기본값" className="border rounded px-2 py-2 w-full text-sm"/>
    </div>
  </div>
);
const WeightSelect = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="border rounded px-3 py-2 w-full text-sm">
      <option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option>
      <option value="600">600 SemiBold</option><option value="700">700 Bold</option><option value="800">800 ExtraBold</option><option value="900">900 Black</option>
    </select>
  </div>
);
const SpacingInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label><input type="number" step="0.01" value={value} onChange={e => onChange(Number(e.target.value))} className="border rounded px-3 py-2 w-full text-sm" min={-0.1} max={1}/></div>
);
const FontSelect = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="border rounded px-3 py-2 w-full text-sm" style={{ fontFamily: value }}>
      {FONT_OPTIONS.map(f => (<option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>))}
    </select>
    <p className="mt-1 text-xs text-gray-400" style={{ fontFamily: value }}>미리보기: 가나다 ABC 123</p>
  </div>
);

export const MainPageManager = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('MAIN');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // 메인페이지 설정 (DB에는 builder_* 필드로 저장)
  const [mainSelected, setMainSelected] = useState<string[]>([]);
  const [mainBannerImages, setMainBannerImages] = useState<string[]>([]);
  const [mainBannerTransition, setMainBannerTransition] = useState('slide');
  const [mainBannerSpeed, setMainBannerSpeed] = useState(3000);
  const [canvasBgColor, setCanvasBgColor] = useState('#FFFFFF');
  const [canvasBgImage, setCanvasBgImage] = useState('');
  const [mainBannerFiles, setMainBannerFiles] = useState<File[]>([]);

  // 디자인
  const [productCardBg, setProductCardBg] = useState('#000000');

  // 상품 상세 페이지 스타일
  const [detailPaddingTop, setDetailPaddingTop] = useState(32);
  const [detailMaxWidth, setDetailMaxWidth] = useState(1300);
  const [detailPriceFont, setDetailPriceFont] = useState('Pretendard');
  const [detailPriceSize, setDetailPriceSize] = useState(24);
  const [detailPriceColor, setDetailPriceColor] = useState('');
  const [detailPriceWeight, setDetailPriceWeight] = useState('700');
  const [detailCategoryFont, setDetailCategoryFont] = useState('Pretendard');
  const [detailCategorySize, setDetailCategorySize] = useState(12);
  const [detailCategoryColor, setDetailCategoryColor] = useState('');
  const [productTextColor, setProductTextColor] = useState('#FFFFFF');
  const [productSubTextColor, setProductSubTextColor] = useState('#9CA3AF');
  const [productAccentColor, setProductAccentColor] = useState('#34D399');
  const [productNameSize, setProductNameSize] = useState(16);
  const [productCategorySize, setProductCategorySize] = useState(12);
  const [productPriceSize, setProductPriceSize] = useState(14);

  // 전역 스타일
  const [globalBgColor, setGlobalBgColor] = useState('#000000');
  const [globalTextColor, setGlobalTextColor] = useState('#FFFFFF');
  const [layoutBorderColor, setLayoutBorderColor] = useState('#FFFFFF');
  const [layoutBorderOpacity, setLayoutBorderOpacity] = useState(0.3);

  // 폰트
  const [fontFamily, setFontFamily] = useState('Pretendard');
  const [fontNav, setFontNav] = useState('Pretendard');
  const [fontNavSize, setFontNavSize] = useState(15);
  const [fontCategory, setFontCategory] = useState('Pretendard');
  const [fontCategorySize, setFontCategorySize] = useState(13);
  const [fontCardName, setFontCardName] = useState('Pretendard');
  const [fontCardNameSize, setFontCardNameSize] = useState(16);
  const [fontCardCat, setFontCardCat] = useState('Pretendard');
  const [fontCardCatSize, setFontCardCatSize] = useState(12);
  const [fontCardPrice, setFontCardPrice] = useState('Pretendard');
  const [fontCardPriceSize, setFontCardPriceSize] = useState(14);
  const [fontDetailTitle, setFontDetailTitle] = useState('Pretendard');
  const [fontDetailTitleSize, setFontDetailTitleSize] = useState(32);
  const [fontDetailBody, setFontDetailBody] = useState('Pretendard');
  const [fontDetailBodySize, setFontDetailBodySize] = useState(14);
  const [fontCompactCat, setFontCompactCat] = useState('Pretendard');
  const [fontCompactCatSize, setFontCompactCatSize] = useState(12);
  const [fontNavColor, setFontNavColor] = useState('');
  const [fontNavWeight, setFontNavWeight] = useState('700');
  const [fontNavSpacing, setFontNavSpacing] = useState(0.05);
  const [fontCategoryColor, setFontCategoryColor] = useState('');
  const [fontCategoryWeight, setFontCategoryWeight] = useState('500');
  const [fontCategorySpacing, setFontCategorySpacing] = useState(0.1);
  const [fontCompactCatColor, setFontCompactCatColor] = useState('');
  const [fontCompactCatWeight, setFontCompactCatWeight] = useState('500');
  const [fontCompactCatSpacing, setFontCompactCatSpacing] = useState(0.1);
  const [fontCardNameColor, setFontCardNameColor] = useState('');
  const [fontCardNameWeight, setFontCardNameWeight] = useState('700');
  const [fontCardNameSpacing, setFontCardNameSpacing] = useState(0);
  const [fontCardCatColor, setFontCardCatColor] = useState('');
  const [fontCardCatWeight, setFontCardCatWeight] = useState('400');
  const [fontCardPriceColor, setFontCardPriceColor] = useState('');
  const [fontCardPriceWeight, setFontCardPriceWeight] = useState('600');
  const [fontDetailTitleColor, setFontDetailTitleColor] = useState('');
  const [fontDetailTitleWeight, setFontDetailTitleWeight] = useState('700');
  const [fontDetailTitleSpacing, setFontDetailTitleSpacing] = useState(0);
  const [fontDetailBodyColor, setFontDetailBodyColor] = useState('');
  const [fontDetailBodyWeight, setFontDetailBodyWeight] = useState('400');

  useEffect(() => { fetchInitialData(); }, []);
  const fetchInitialData = async () => { await fetchCategories(); await fetchSettings(); };
  const fetchCategories = async () => { const { data } = await supabase.from('categories').select('id, name, slug, section').order('display_order', { ascending: true }); setCategories(data || []); };

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (!data) return;
    setMainSelected(Array.isArray(data.builder_home_categories) ? data.builder_home_categories.map(String) : []);
    setMainBannerImages(data.builder_banner_images || []);
    setMainBannerTransition(data.builder_banner_transition || 'slide');
    setMainBannerSpeed(data.builder_banner_speed || 3000);
    setCanvasBgColor(data.canvas_bg_color || '#FFFFFF');
    setCanvasBgImage(data.canvas_bg_image || '');
    setProductCardBg(data.product_card_bg || '#000000');
    // 상세 페이지 스타일
    setDetailPaddingTop(data.detail_page_padding_top ?? 32);
    setDetailMaxWidth(data.detail_page_max_width ?? 1300);
    setDetailPriceFont(data.detail_price_font || baseFont);
    setDetailPriceSize(data.detail_price_size || 24);
    setDetailPriceColor(data.detail_price_color || '');
    setDetailPriceWeight(data.detail_price_weight || '700');
    setDetailCategoryFont(data.detail_category_font || baseFont);
    setDetailCategorySize(data.detail_category_size || 12);
    setDetailCategoryColor(data.detail_category_color || '');
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
    const baseFont = data.font_family || 'Pretendard';
    setFontFamily(baseFont);
    setFontNav(data.font_nav || baseFont); setFontNavSize(data.font_nav_size || 15);
    setFontCategory(data.font_category || baseFont); setFontCategorySize(data.font_category_size || 13);
    setFontCardName(data.font_card_name || baseFont); setFontCardNameSize(data.font_card_name_size || 16);
    setFontCardCat(data.font_card_cat || baseFont); setFontCardCatSize(data.font_card_cat_size || 12);
    setFontCardPrice(data.font_card_price || baseFont); setFontCardPriceSize(data.font_card_price_size || 14);
    setFontDetailTitle(data.font_detail_title || baseFont); setFontDetailTitleSize(data.font_detail_title_size || 32);
    setFontDetailBody(data.font_detail_body || baseFont); setFontDetailBodySize(data.font_detail_body_size || 14);
    setFontCompactCat(data.font_compact_cat || baseFont); setFontCompactCatSize(data.font_compact_cat_size || 12);
    setFontNavColor(data.font_nav_color || ''); setFontNavWeight(data.font_nav_weight || '700'); setFontNavSpacing(data.font_nav_spacing ?? 0.05);
    setFontCategoryColor(data.font_category_color || ''); setFontCategoryWeight(data.font_category_weight || '500'); setFontCategorySpacing(data.font_category_spacing ?? 0.1);
    setFontCompactCatColor(data.font_compact_cat_color || ''); setFontCompactCatWeight(data.font_compact_cat_weight || '500'); setFontCompactCatSpacing(data.font_compact_cat_spacing ?? 0.1);
    setFontCardNameColor(data.font_card_name_color || ''); setFontCardNameWeight(data.font_card_name_weight || '700'); setFontCardNameSpacing(data.font_card_name_spacing ?? 0);
    setFontCardCatColor(data.font_card_cat_color || ''); setFontCardCatWeight(data.font_card_cat_weight || '400');
    setFontCardPriceColor(data.font_card_price_color || ''); setFontCardPriceWeight(data.font_card_price_weight || '600');
    setFontDetailTitleColor(data.font_detail_title_color || ''); setFontDetailTitleWeight(data.font_detail_title_weight || '700'); setFontDetailTitleSpacing(data.font_detail_title_spacing ?? 0);
    setFontDetailBodyColor(data.font_detail_body_color || ''); setFontDetailBodyWeight(data.font_detail_body_weight || '400');
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
      try { const url = await uploadImage(e.target.files[0]); setter(url); } catch (error) { console.error(error); alert('Upload failed'); } finally { setUploading(false); }
    }
  };

  const handleSave = async (type: ConfigTab) => {
    setUploading(true); setMessage('');
    try {
      let updateData: any = {};
      if (type === 'MAIN') {
        let newImages = [...mainBannerImages];
        for (const file of mainBannerFiles) { const url = await uploadImage(file); if (url) newImages.push(url); }
        updateData = { builder_home_categories: mainSelected, builder_banner_images: newImages, builder_banner_transition: mainBannerTransition, builder_banner_speed: mainBannerSpeed, canvas_bg_color: canvasBgColor, canvas_bg_image: canvasBgImage };
        setMainBannerImages(newImages); setMainBannerFiles([]);
      } else if (type === 'STYLE') {
        updateData = { product_card_bg: productCardBg, product_text_color: productTextColor, product_sub_text_color: productSubTextColor, product_accent_color: productAccentColor, product_name_size: productNameSize, product_category_size: productCategorySize, product_price_size: productPriceSize };
      } else if (type === 'DETAIL') {
        updateData = {
          detail_page_padding_top: detailPaddingTop,
          detail_page_max_width: detailMaxWidth,
          detail_price_font: detailPriceFont,
          detail_price_size: detailPriceSize,
          detail_price_color: detailPriceColor || null,
          detail_price_weight: detailPriceWeight,
          detail_category_font: detailCategoryFont,
          detail_category_size: detailCategorySize,
          detail_category_color: detailCategoryColor || null,
        };
      } else if (type === 'GLOBAL') {
        updateData = {
          global_bg_color: globalBgColor, global_text_color: globalTextColor, layout_border_color: layoutBorderColor, layout_border_opacity: layoutBorderOpacity,
          font_family: fontFamily, font_nav: fontNav, font_nav_size: fontNavSize, font_category: fontCategory, font_category_size: fontCategorySize,
          font_card_name: fontCardName, font_card_name_size: fontCardNameSize, font_card_cat: fontCardCat, font_card_cat_size: fontCardCatSize,
          font_card_price: fontCardPrice, font_card_price_size: fontCardPriceSize, font_detail_title: fontDetailTitle, font_detail_title_size: fontDetailTitleSize,
          font_detail_body: fontDetailBody, font_detail_body_size: fontDetailBodySize, font_compact_cat: fontCompactCat, font_compact_cat_size: fontCompactCatSize,
          font_nav_color: fontNavColor || null, font_nav_weight: fontNavWeight, font_nav_spacing: fontNavSpacing,
          font_category_color: fontCategoryColor || null, font_category_weight: fontCategoryWeight, font_category_spacing: fontCategorySpacing,
          font_compact_cat_color: fontCompactCatColor || null, font_compact_cat_weight: fontCompactCatWeight, font_compact_cat_spacing: fontCompactCatSpacing,
          font_card_name_color: fontCardNameColor || null, font_card_name_weight: fontCardNameWeight, font_card_name_spacing: fontCardNameSpacing,
          font_card_cat_color: fontCardCatColor || null, font_card_cat_weight: fontCardCatWeight,
          font_card_price_color: fontCardPriceColor || null, font_card_price_weight: fontCardPriceWeight,
          font_detail_title_color: fontDetailTitleColor || null, font_detail_title_weight: fontDetailTitleWeight, font_detail_title_spacing: fontDetailTitleSpacing,
          font_detail_body_color: fontDetailBodyColor || null, font_detail_body_weight: fontDetailBodyWeight,
        };
      }
      const { error } = await supabase.from('site_settings').update(updateData).eq('id', 1);
      if (error) throw error;
      setMessage('✅ Settings saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) { console.error(err); setMessage(`❌ Save failed: ${err.message}`); } finally { setUploading(false); }
  };

  return (
    <div>
      <div className="mb-6"><h3 className="text-lg font-semibold text-gray-800">Main Page & Design Manager</h3></div>
      {message && <div className={`mb-4 px-4 py-3 rounded-lg ${message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>{message}</div>}

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {(['MAIN', 'STYLE', 'DETAIL', 'GLOBAL'] as ConfigTab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
            {tab === 'MAIN' ? '🏠 MAIN PAGE' : tab === 'STYLE' ? 'PRODUCT STYLE' : tab === 'DETAIL' ? '📋 DETAIL STYLE' : 'GLOBAL STYLE'}
          </button>
        ))}
      </div>

      {activeTab === 'MAIN' && (
        <div className="space-y-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            🏠 메인페이지 설정입니다. 배너, 카테고리 노출, 드롭존 스타일을 설정하세요.
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon size={18}/> Main Banners</h4>
            <div className="grid grid-cols-4 gap-3 mb-4">{mainBannerImages.map((url, i) => (<div key={i} className="relative group aspect-video"><img src={url} className="w-full h-full object-cover rounded border" /><button onClick={() => setMainBannerImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={14}/></button></div>))}</div>
            <input type="file" multiple onChange={(e) => e.target.files && setMainBannerFiles(Array.from(e.target.files))} className="block w-full text-sm text-gray-500 mb-4"/>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div><label className="block text-sm font-medium mb-1">Transition</label><select value={mainBannerTransition} onChange={(e) => setMainBannerTransition(e.target.value)} className="w-full border rounded p-2"><option value="slide">Slide</option><option value="fade">Fade</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Speed (ms)</label><input type="number" value={mainBannerSpeed} onChange={(e) => setMainBannerSpeed(Number(e.target.value))} className="w-full border rounded p-2" /></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Monitor size={18}/> Drop Zone (Canvas) Style</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium mb-1">Background Color</label><div className="flex gap-2"><input type="color" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Background Image</label><div className="mb-2 h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden border">{canvasBgImage ? <img src={canvasBgImage} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">No Image</span>}</div><div className="flex gap-2"><input type="file" onChange={(e) => handleSingleImageUpload(e, setCanvasBgImage)} className="block w-full text-xs text-gray-500"/>{canvasBgImage && <button onClick={() => setCanvasBgImage('')} className="bg-red-50 text-red-500 px-2 rounded text-xs border border-red-200">Delete</button>}</div></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Layout size={18}/> Main Home Categories</h4>
            <p className="text-xs text-gray-500 mb-3">메인페이지 하단에 노출할 카테고리를 선택하세요</p>
            <div className="border rounded p-4 max-h-60 overflow-y-auto grid grid-cols-2 gap-2">{categories.map(c => (<label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"><input type="checkbox" checked={mainSelected.includes(String(c.id))} onChange={() => setMainSelected(prev => prev.includes(String(c.id)) ? prev.filter(x => x !== String(c.id)) : [...prev, String(c.id)])} className="w-4 h-4 rounded text-blue-600" /><span className="text-sm font-medium">{c.name}</span></label>))}</div>
          </div>
          <button onClick={() => handleSave('MAIN')} disabled={uploading} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full font-bold text-lg">{uploading ? 'Saving...' : 'Save MAIN PAGE Config'}</button>
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

      {activeTab === 'DETAIL' && (
        <div className="space-y-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
            📋 상품 상세 페이지의 레이아웃과 폰트 스타일을 설정합니다. 제목/본문 폰트는 GLOBAL STYLE 탭에서 설정 가능합니다.
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4">레이아웃</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">상단 여백 (px)</label><input type="number" value={detailPaddingTop} onChange={e => setDetailPaddingTop(Number(e.target.value))} className="w-full border rounded px-3 py-2" min={0} max={120}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">최대 너비 (px)</label><input type="number" value={detailMaxWidth} onChange={e => setDetailMaxWidth(Number(e.target.value))} className="w-full border rounded px-3 py-2" min={600} max={1800}/></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4">가격 폰트</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">폰트</label><input type="text" value={detailPriceFont} onChange={e => setDetailPriceFont(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Pretendard"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">크기 (px)</label><input type="number" value={detailPriceSize} onChange={e => setDetailPriceSize(Number(e.target.value))} className="w-full border rounded px-3 py-2" min={12} max={48}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">컬러</label><div className="flex gap-2"><input type="color" value={detailPriceColor || '#34d399'} onChange={e => setDetailPriceColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border"/><input type="text" value={detailPriceColor} onChange={e => setDetailPriceColor(e.target.value)} placeholder="기본=accent" className="flex-1 border rounded px-2 py-2 text-sm"/></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">두께</label><select value={detailPriceWeight} onChange={e => setDetailPriceWeight(e.target.value)} className="w-full border rounded px-3 py-2 text-sm"><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 SemiBold</option><option value="700">700 Bold</option><option value="800">800 ExtraBold</option></select></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 mb-4">카테고리 라벨 폰트</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">폰트</label><input type="text" value={detailCategoryFont} onChange={e => setDetailCategoryFont(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Pretendard"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">크기 (px)</label><input type="number" value={detailCategorySize} onChange={e => setDetailCategorySize(Number(e.target.value))} className="w-full border rounded px-3 py-2" min={8} max={24}/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">컬러</label><div className="flex gap-2"><input type="color" value={detailCategoryColor || '#888888'} onChange={e => setDetailCategoryColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border"/><input type="text" value={detailCategoryColor} onChange={e => setDetailCategoryColor(e.target.value)} placeholder="기본값" className="flex-1 border rounded px-2 py-2 text-sm"/></div></div>
            </div>
          </div>
          <button onClick={() => handleSave('DETAIL')} disabled={uploading} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 w-full font-bold text-lg">{uploading ? 'Saving...' : 'Save Detail Style'}</button>
        </div>
      )}

      {activeTab === 'GLOBAL' && (
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><Settings size={18}/> Global Color Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium mb-1">Global Background Color</label><div className="flex gap-2"><input type="color" value={globalBgColor} onChange={(e) => setGlobalBgColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={globalBgColor} onChange={(e) => setGlobalBgColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Global Font Color</label><div className="flex gap-2"><input type="color" value={globalTextColor} onChange={(e) => setGlobalTextColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={globalTextColor} onChange={(e) => setGlobalTextColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Layout Border Color</label><div className="flex gap-2"><input type="color" value={layoutBorderColor} onChange={(e) => setLayoutBorderColor(e.target.value)} className="h-10 w-20 cursor-pointer"/><input type="text" value={layoutBorderColor} onChange={(e) => setLayoutBorderColor(e.target.value)} className="border rounded px-3 w-full"/></div></div>
              <div><label className="block text-sm font-medium mb-1">Border Opacity (0.0 ~ 1.0)</label><input type="number" step="0.1" min="0" max="1" value={layoutBorderOpacity} onChange={(e) => setLayoutBorderOpacity(Number(e.target.value))} className="border rounded px-3 py-2 w-full"/></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-2 border-b pb-2">🔤 사이트 기본 폰트</h4>
            <p className="text-xs text-gray-400 mb-4">전체 기본 폰트를 설정합니다. 아래 개별 설정이 없으면 이 폰트가 적용됩니다.</p>
            <FontSelect label="기본 폰트 (전체 적용)" value={fontFamily} onChange={setFontFamily} />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">🎨 영역별 폰트 & 사이즈</h4>
            <div className="space-y-6">
              <FontSection label="카테고리 메뉴 (헤더)" bg="bg-gray-50"><FontSelect label="폰트" value={fontCategory} onChange={setFontCategory} /><SizeInput label="사이즈 (px)" value={fontCategorySize} onChange={setFontCategorySize} min={10} max={40}/><ColorInput label="컬러" value={fontCategoryColor} onChange={setFontCategoryColor} /><WeightSelect label="두께" value={fontCategoryWeight} onChange={setFontCategoryWeight} /><SpacingInput label="자간 (em)" value={fontCategorySpacing} onChange={setFontCategorySpacing} /></FontSection>
              <FontSection label="Compact 카테고리 (스크롤 후)" bg="bg-indigo-50 border-indigo-200"><FontSelect label="폰트" value={fontCompactCat} onChange={setFontCompactCat} /><SizeInput label="사이즈 (px)" value={fontCompactCatSize} onChange={setFontCompactCatSize} min={8} max={20}/><ColorInput label="컬러" value={fontCompactCatColor} onChange={setFontCompactCatColor} /><WeightSelect label="두께" value={fontCompactCatWeight} onChange={setFontCompactCatWeight} /><SpacingInput label="자간 (em)" value={fontCompactCatSpacing} onChange={setFontCompactCatSpacing} /></FontSection>
              <FontSection label="상품 카드 - 상품명" bg="bg-gray-50"><FontSelect label="폰트" value={fontCardName} onChange={setFontCardName} /><SizeInput label="사이즈 (px)" value={fontCardNameSize} onChange={setFontCardNameSize} min={10} max={40}/><ColorInput label="컬러" value={fontCardNameColor} onChange={setFontCardNameColor} /><WeightSelect label="두께" value={fontCardNameWeight} onChange={setFontCardNameWeight} /><SpacingInput label="자간 (em)" value={fontCardNameSpacing} onChange={setFontCardNameSpacing} /></FontSection>
              <FontSection label="상품 카드 - 카테고리" bg="bg-gray-50"><FontSelect label="폰트" value={fontCardCat} onChange={setFontCardCat} /><SizeInput label="사이즈 (px)" value={fontCardCatSize} onChange={setFontCardCatSize} min={8} max={30}/><ColorInput label="컬러" value={fontCardCatColor} onChange={setFontCardCatColor} /><WeightSelect label="두께" value={fontCardCatWeight} onChange={setFontCardCatWeight} /></FontSection>
              <FontSection label="상품 카드 - 가격" bg="bg-gray-50"><FontSelect label="폰트" value={fontCardPrice} onChange={setFontCardPrice} /><SizeInput label="사이즈 (px)" value={fontCardPriceSize} onChange={setFontCardPriceSize} min={10} max={30}/><ColorInput label="컬러" value={fontCardPriceColor} onChange={setFontCardPriceColor} /><WeightSelect label="두께" value={fontCardPriceWeight} onChange={setFontCardPriceWeight} /></FontSection>
              <FontSection label="상품 상세 - 제목" bg="bg-gray-50"><FontSelect label="폰트" value={fontDetailTitle} onChange={setFontDetailTitle} /><SizeInput label="사이즈 (px)" value={fontDetailTitleSize} onChange={setFontDetailTitleSize} min={16} max={72}/><ColorInput label="컬러" value={fontDetailTitleColor} onChange={setFontDetailTitleColor} /><WeightSelect label="두께" value={fontDetailTitleWeight} onChange={setFontDetailTitleWeight} /><SpacingInput label="자간 (em)" value={fontDetailTitleSpacing} onChange={setFontDetailTitleSpacing} /></FontSection>
              <FontSection label="상품 상세 - 본문" bg="bg-gray-50"><FontSelect label="폰트" value={fontDetailBody} onChange={setFontDetailBody} /><SizeInput label="사이즈 (px)" value={fontDetailBodySize} onChange={setFontDetailBodySize} min={10} max={30}/><ColorInput label="컬러" value={fontDetailBodyColor} onChange={setFontDetailBodyColor} /><WeightSelect label="두께" value={fontDetailBodyWeight} onChange={setFontDetailBodyWeight} /></FontSection>
            </div>
          </div>
          <button onClick={() => handleSave('GLOBAL')} disabled={uploading} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 w-full font-bold text-lg">{uploading ? 'Saving...' : 'Save GLOBAL Styles'}</button>
        </div>
      )}
    </div>
  );
};