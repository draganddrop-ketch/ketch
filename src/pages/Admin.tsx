import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X,
  LayoutGrid, Settings, Package, Image as ImageIcon,
  Home, ShoppingCart, Users, MessageSquare, 
  ExternalLink, Palette, LogOut, ChevronUp, ChevronDown, Tag, Save,
  Truck, ClipboardList, RefreshCw 
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { KeyringItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageCropperModal } from '../components/ImageCropperModal';

import { SiteSettingsForm } from '../components/SiteSettingsForm';
import { MainPageManager } from '../components/MainPageManager';
import { ShippingManager } from '../components/ShippingManager';
import { OrderManager } from '../components/OrderManager';
import { CustomerManager } from '../components/CustomerManager';

interface Category { id: string; name: string; slug: string; display_order: number; section: 'SHOP' | 'BUILDER'; is_hidden: boolean; }
interface Profile { id: string; email: string; role: string; created_at: string; }
type TabType = 'dashboard' | 'orders' | 'products' | 'customers' | 'reviews' | 'design' | 'settings' | 'shipping';
type GalleryItem = { id: string; previewUrl: string; file?: File; isRemote: boolean };
type CropTarget = { type: 'main' } | { type: 'gallery'; id: string };

/**
 * 🛠️ 이미지 분석 함수
 */
const getObjectDimensions = (src: string | File): Promise<{ width: number; height: number; objectWidth: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = typeof src === 'string' ? src : URL.createObjectURL(src);

    img.crossOrigin = "Anonymous"; 

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          if (typeof src !== 'string') URL.revokeObjectURL(url);
          resolve({ width: img.width, height: img.height, objectWidth: img.width });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let minX = canvas.width;
        let maxX = 0;
        let hasPixels = false;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 10) { 
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              hasPixels = true;
            }
          }
        }

        if (typeof src !== 'string') URL.revokeObjectURL(url);

        const objectWidth = hasPixels ? (maxX - minX + 1) : img.width;
        console.log(`📏 분석 결과: 전체 ${img.width}px / 물체 ${objectWidth}px`);
        
        resolve({ width: img.width, height: img.height, objectWidth });

      } catch (e) {
        console.error("⚠️ 분석 중 오류 (기본값 사용):", e);
        if (typeof src !== 'string') URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height, objectWidth: img.width });
      }
    };

    img.onerror = () => {
      console.error("❌ 이미지 로드 실패");
      if (typeof src !== 'string') URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0, objectWidth: 0 });
    };

    img.src = url;
  });
};

export const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<KeyringItem | null>(null);
  
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const [productFormData, setProductFormData] = useState<any>({
    name: '', section: 'SHOP', categories: [], sub_category: '', price: '', sale_price: '', stock_quantity: '0', status: 'active', description: '', is_best: false, is_new: false, real_width_cm: '', object_px_width: 0, image_width: 0,
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string>('');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySection, setNewCategorySection] = useState<'SHOP'|'BUILDER'>('SHOP');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login');
    if (user) { fetchCategories(); fetchProducts(); fetchProfiles(); }
  }, [user, authLoading]);

  const fetchCategories = async () => { const { data } = await supabase.from('categories').select('*').order('display_order'); if (data) setCategories(data); };
  const fetchProducts = async () => { const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }); if (data) { const formatted = data.map(item => ({ ...item, image: item.image_url, category_ids: item.category_ids || (item.category ? [item.category] : []), sub_category: item.sub_category || '' })); setProducts(formatted as any); } };
  const fetchProfiles = async () => { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); if (data) setProfiles(data); };
  
  const getCategoryCount = (slug: string) => { if (slug === 'all') return products.length; return products.filter(p => { const catIds = p.category_ids || [p.category]; return catIds.includes(slug); }).length; };
  const filteredProducts = products.filter(product => { let matchCategory = true; if (activeCategory !== 'all') { const catIds = product.category_ids || [product.category]; matchCategory = catIds.includes(activeCategory); } const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()); return matchCategory && matchSearch; });
  
  const openAddModal = () => { 
    setEditingProduct(null); 
    setProductFormData({ name: '', section: 'SHOP', categories: [], sub_category: '', price: '', sale_price: '', stock_quantity: '100', status: 'active', description: '', is_best: false, is_new: false, real_width_cm: '', object_px_width: 0, image_width: 0 }); 
    setMainImageFile(null);
    setMainImagePreviewUrl(''); 
    setGalleryItems([]); 
    setIsProductModalOpen(true); 
  };
  
  const openEditModal = (product: any) => { 
    setEditingProduct(product); 
    const savedCategories = product.category_ids && product.category_ids.length > 0 ? product.category_ids : (product.category ? [product.category] : []); 
    let section: 'SHOP' | 'BUILDER' = 'SHOP'; 
    if (savedCategories.length > 0) { const foundCat = categories.find(c => c.slug === savedCategories[0]); if (foundCat) section = foundCat.section; } 
    
    setProductFormData({ 
      name: product.name, 
      section: section, 
      categories: savedCategories, 
      sub_category: product.sub_category || '', 
      price: product.price.toString(), 
      sale_price: product.sale_price?.toString() || '', 
      stock_quantity: product.stock_quantity?.toString() || '0', 
      status: product.status || 'active', 
      description: product.description || '', 
      is_best: product.is_best || false, 
      is_new: product.is_new || false, 
      real_width_cm: product.real_width_cm ? product.real_width_cm.toString() : '', 
      object_px_width: product.object_px_width || 0, 
      image_width: product.image_width || 0 
    }); 
    setMainImageFile(null);
    setMainImagePreviewUrl(product.image || ''); 
    setGalleryItems((product.gallery_images || []).map((url: string) => ({ id: `${Date.now()}_${Math.random()}`, previewUrl: url, isRemote: true }))); 
    setIsProductModalOpen(true); 
  };
  
  const toggleCategorySelection = (slug: string) => { setProductFormData((prev: any) => { const isSelected = prev.categories.includes(slug); if (isSelected) { return { ...prev, categories: prev.categories.filter((c: string) => c !== slug) }; } else { return { ...prev, categories: [...prev.categories, slug] }; } }); };
  
  // ✅ [수정됨] 저장 시 이미지 분석 강제 실행
  const handleSaveProduct = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!productFormData.name) return alert('상품명을 입력해주세요.'); 
    if (!productFormData.price) return alert('가격을 입력해주세요.'); 
    if (productFormData.categories.length === 0) return alert('최소 1개 이상의 카테고리를 선택해주세요.'); 
    
    setUploading(true); 
    
    try { 
      // 1. 저장 전 이미지 크기 자동 분석
      let finalObjectWidth = productFormData.object_px_width;
      let finalImageWidth = productFormData.image_width;
      
      const imageSource = mainImageFile || mainImagePreviewUrl;
      
      // 이미지가 존재하면 무조건 분석 시도 (재분석 버튼 안 눌러도 됨)
      if (imageSource) {
        try {
          console.log("💾 저장 시 자동 분석 시작...");
          const dims = await getObjectDimensions(imageSource);
          // 분석 결과가 유효하면 값 덮어쓰기
          if (dims.width > 0) {
            finalObjectWidth = dims.objectWidth;
            finalImageWidth = dims.width;
            console.log("💾 자동 분석 적용 완료:", dims);
          }
        } catch (analyzeErr) {
          console.error("자동 분석 실패 (기존 값 유지):", analyzeErr);
        }
      }

      // 2. 이미지 업로드
      let imageUrl = mainImagePreviewUrl; 
      if (mainImageFile) imageUrl = await uploadImageToSupabase(mainImageFile); 
      
      let galleryUrls: string[] = []; 
      if (galleryItems.length > 0) { 
        const newUrls = await Promise.all(galleryItems.map(async (item) => { 
          if (item.file) return await uploadImageToSupabase(item.file); 
          return item.previewUrl; 
        })); 
        galleryUrls = newUrls.filter(Boolean) as string[]; 
      } 
      
      // 3. Payload 생성 (자동 분석된 값 사용)
      const payload = { 
        name: productFormData.name, 
        category: productFormData.categories[0], 
        category_ids: productFormData.categories, 
        sub_category: productFormData.sub_category || null, 
        price: parseInt(productFormData.price), 
        sale_price: productFormData.sale_price ? parseInt(productFormData.sale_price) : null, 
        stock_quantity: parseInt(productFormData.stock_quantity) || 0, 
        status: productFormData.status, 
        image_url: imageUrl, 
        gallery_images: galleryUrls, 
        description: productFormData.description, 
        is_best: productFormData.is_best, 
        is_new: productFormData.is_new, 
        real_width_cm: productFormData.real_width_cm ? parseFloat(productFormData.real_width_cm) : null, 
        
        // ✅ 여기가 핵심: 자동 분석된 값을 저장
        object_px_width: finalObjectWidth, 
        image_width: finalImageWidth, 
      }; 
      
      let error; 
      if (editingProduct) { 
        const res = await supabase.from('products').update(payload).eq('id', editingProduct.id); 
        error = res.error; 
      } else { 
        const res = await supabase.from('products').insert(payload); 
        error = res.error; 
      } 
      
      if (error) throw error; 
      
      await fetchProducts(); 
      setIsProductModalOpen(false); 
      alert('성공적으로 저장되었습니다.'); 
    } catch (error: any) { 
      console.error('저장 실패:', error); 
      alert(`저장 중 오류가 발생했습니다.\n${error.message}`); 
    } finally { 
      setUploading(false); 
    } 
  };

  const uploadImageToSupabase = async (file: File) => { const fileExt = file.name.split('.').pop(); const fileName = `${Date.now()}_${Math.random()}.${fileExt}`; const { error } = await supabase.storage.from('product-images').upload(fileName, file); if (error) throw error; const { data } = supabase.storage.from('product-images').getPublicUrl(fileName); return data.publicUrl; };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'gallery') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'main') {
        const file = e.target.files[0];
        if (mainImagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(mainImagePreviewUrl);
        setMainImageFile(file);
        setMainImagePreviewUrl(URL.createObjectURL(file));
        await analyzeImage(file);
      } else {
        const newFiles = Array.from(e.target.files!);
        const newItems: GalleryItem[] = newFiles.map((file) => ({
          id: `${Date.now()}_${Math.random()}`,
          previewUrl: URL.createObjectURL(file),
          file,
          isRemote: false
        }));
        setGalleryItems(prev => [...prev, ...newItems]);
      }
    }
  };

  const openCropperForMain = () => {
    if (!mainImagePreviewUrl) return;
    setCropImageSrc(mainImagePreviewUrl);
    setCropTarget({ type: 'main' });
    setIsCropperOpen(true);
  };

  const openCropperForGallery = (id: string) => {
    const item = galleryItems.find(i => i.id === id);
    if (!item) return;
    setCropImageSrc(item.previewUrl);
    setCropTarget({ type: 'gallery', id });
    setIsCropperOpen(true);
  };

  const closeCropper = () => {
    setIsCropperOpen(false);
    setCropTarget(null);
    setCropImageSrc('');
  };

  const handleCropSave = async (file: File, previewUrl: string) => {
    if (!cropTarget) return;
    if (cropTarget.type === 'main') {
      if (mainImagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(mainImagePreviewUrl);
      setMainImageFile(file);
      setMainImagePreviewUrl(previewUrl);
      await analyzeImage(file);
    } else {
      setGalleryItems(prev => prev.map(item => {
        if (item.id !== cropTarget.id) return item;
        if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
        return { ...item, previewUrl, file, isRemote: false };
      }));
    }
    closeCropper();
  };

  const removeGalleryItem = (id: string) => {
    setGalleryItems(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(item => item.id !== id);
    });
  };

  const analyzeImage = async (source: File | string) => {
    setIsAnalyzingImage(true);
    try {
      const dimensions = await getObjectDimensions(source);
      setProductFormData((prev: any) => ({ 
        ...prev, 
        image_width: dimensions.width, 
        object_px_width: dimensions.objectWidth 
      }));
      console.log("이미지 분석 완료:", dimensions);
    } catch (err) {
      console.error("이미지 분석 실패:", err);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleAddCategory = async () => { if (!newCategoryName.trim()) return; const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'); const sectionCategories = categories.filter(c => c.section === newCategorySection); const maxOrder = sectionCategories.length > 0 ? Math.max(...sectionCategories.map(c => c.display_order)) : 0; await supabase.from('categories').insert({ name: newCategoryName.trim(), slug, section: newCategorySection, display_order: maxOrder + 1, is_hidden: false }); setNewCategoryName(''); fetchCategories(); };
  const handleDeleteCategory = async (id: string) => { if (!confirm('삭제하시겠습니까?')) return; await supabase.from('categories').delete().eq('id', id); fetchCategories(); };
  const handleUpdateCategoryName = async (id: string) => { if (!editingCategoryName.trim()) return; const slug = editingCategoryName.trim().toLowerCase().replace(/\s+/g, '-'); await supabase.from('categories').update({ name: editingCategoryName, slug }).eq('id', id); setEditingCategoryId(null); fetchCategories(); };
  const handleMoveCategory = async (index: number, direction: 'up' | 'down', list: Category[]) => { const curr = list[index]; const target = direction === 'up' ? list[index - 1] : list[index + 1]; if (!target) return; await supabase.from('categories').update({ display_order: target.display_order }).eq('id', curr.id); await supabase.from('categories').update({ display_order: curr.display_order }).eq('id', target.id); fetchCategories(); };
  const handleLogout = async () => { await signOut(); navigate('/admin/login'); };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-sm flex-shrink-0">
        <div className="p-5 space-y-1 border-b border-gray-100">
          <button onClick={() => window.open('/', '_blank')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg group"><div className="flex items-center gap-2"><Home size={18} className="text-blue-600" /><span className="font-semibold text-gray-800">내 상점 바로 가기</span></div><ExternalLink size={14} className="text-gray-400 group-hover:text-blue-600" /></button>
          <button onClick={() => setActiveTab('design')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg group ${activeTab === 'design' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-2"><Palette size={18} className={activeTab === 'design' ? 'text-red-500' : 'text-red-400'} /><span className="font-semibold">디자인 편집</span></div></button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg group ${activeTab === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-2"><Settings size={18} className={activeTab === 'settings' ? 'text-orange-500' : 'text-orange-400'} /><span className="font-semibold">상점 설정</span></div></button>
        </div>
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'orders' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}><ClipboardList size={20} /> 주문</button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'products' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}><Package size={20} /> 상품</button>
          <button onClick={() => setActiveTab('shipping')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'shipping' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}><Truck size={20} /> 배송</button>
          <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'customers' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}><Users size={20} /> 고객</button>
          <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeTab === 'reviews' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}><MessageSquare size={20} /> 후기와 질문</button>
        </div>
        <div className="p-4 border-t border-gray-200"><button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><LogOut size={18} /> 로그아웃</button></div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {activeTab === 'orders' && <div className="h-full overflow-y-auto bg-gray-50"><OrderManager /></div>}
        {activeTab === 'shipping' && <div className="h-full overflow-y-auto bg-gray-50"><ShippingManager /></div>}
        {activeTab === 'customers' && <div className="h-full overflow-y-auto bg-gray-50"><CustomerManager /></div>}
        {activeTab === 'design' && <div className="p-8 h-full overflow-y-auto"><h2 className="text-2xl font-bold mb-4">메인 디자인 편집</h2><MainPageManager /></div>}
        {activeTab === 'settings' && <div className="p-8 h-full overflow-y-auto"><h2 className="text-2xl font-bold mb-4">상점 설정</h2><SiteSettingsForm /></div>}
        {activeTab === 'reviews' && <div className="p-8 h-full overflow-y-auto"><h2 className="text-2xl font-bold mb-4">후기와 질문</h2><div className="bg-white p-6 border rounded-lg text-gray-500">Q&A 게시판이 여기에 표시됩니다.</div></div>}

        {activeTab === 'products' && (
          <div className="flex h-full">
            <div className="w-60 border-r border-gray-100 flex flex-col bg-gray-50/50">
              <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-gray-800 flex items-center gap-2"><Package className="text-purple-600" size={18} /> 상품 관리</h2></div>
              <div className="p-3 space-y-1 flex-1 overflow-y-auto">
                <button onClick={() => setActiveCategory('all')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${activeCategory === 'all' ? 'bg-white shadow-sm text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}><span>전체 상품</span><span className="text-xs bg-gray-200 px-1.5 rounded-full text-gray-600">{getCategoryCount('all')}</span></button>
                {['SHOP', 'BUILDER'].map(section => (
                  <div key={section}><div className="mt-4 mb-1 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{section}</div>
                    {categories.filter(c => c.section === section).map((cat) => (
                      <button key={cat.id} onClick={() => setActiveCategory(cat.slug)} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${activeCategory === cat.slug ? 'bg-white shadow-sm text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}><span>{cat.name}</span><span className="text-xs text-gray-200 px-1.5 rounded-full text-gray-500">{getCategoryCount(cat.slug)}</span></button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200"><button onClick={() => setIsCategoryManagerOpen(true)} className="w-full py-2 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600 font-medium flex items-center justify-center gap-1"><Settings size={14}/> 카테고리 순서/설정 관리</button></div>
            </div>
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h1 className="text-xl font-bold text-gray-800">{activeCategory === 'all' ? '전체 상품' : categories.find(c => c.slug === activeCategory)?.name}</h1><div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="상품명 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-purple-500" /></div><button onClick={openAddModal} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center gap-2 shadow-sm"><Plus size={16} /> 상품 추가하기</button></div></div>
              <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b border-gray-100 text-gray-400 text-xs uppercase"><th className="py-3 px-2 w-10"><input type="checkbox" /></th><th className="py-3 px-2">상품 정보</th><th className="py-3 px-2 text-right">가격</th><th className="py-3 px-2 text-center">수량</th><th className="py-3 px-2 text-center">상태</th><th className="py-3 px-2 text-right">관리</th></tr></thead>
                  <tbody>{filteredProducts.map((product) => (<tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 group"><td className="py-4 px-2"><input type="checkbox" /></td><td className="py-4 px-2"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">{product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>}</div><div><div className="font-medium text-gray-700 text-sm">{product.name}</div><div className="text-xs text-gray-400">{product.sub_category || product.category}</div></div></div></td><td className="py-4 px-2 text-right text-sm font-medium">{product.sale_price ? (<div><span className="text-red-500 font-bold">₩{product.sale_price.toLocaleString()}</span><div className="text-xs text-gray-400 line-through">₩{product.price.toLocaleString()}</div></div>) : (<span>₩{product.price.toLocaleString()}</span>)}</td><td className="py-4 px-2 text-center text-sm text-gray-500">{product.stock_quantity === 0 ? <span className="text-red-500">품절</span> : `${product.stock_quantity}개`}</td><td className="py-4 px-2 text-center"><span className={`text-xs px-2 py-1 rounded-full ${product.status === 'active' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-100'}`}>{product.status === 'active' ? '판매 중' : '숨김'}</span></td><td className="py-4 px-2 text-right"><button onClick={() => openEditModal(product)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors">편집</button></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10"><h2 className="text-xl font-bold text-gray-900">{editingProduct ? '상품 수정' : '새 상품 등록'}</h2><button onClick={() => setIsProductModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label><input type="text" required value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">추가 카테고리명 (Sub Category)</label><input type="text" value={productFormData.sub_category} onChange={e => setProductFormData({...productFormData, sub_category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" placeholder="예: BEST ITEM, NEW ARRIVAL" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">카테고리 선택 (중복 가능) *</label><div className="flex gap-2 mb-3"><button type="button" onClick={() => setProductFormData({...productFormData, section: 'SHOP'})} className={`flex-1 py-2 rounded-lg font-bold text-sm ${productFormData.section === 'SHOP' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500' : 'bg-gray-100 text-gray-500'}`}>SHOP</button><button type="button" onClick={() => setProductFormData({...productFormData, section: 'BUILDER'})} className={`flex-1 py-2 rounded-lg font-bold text-sm ${productFormData.section === 'BUILDER' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-500'}`}>BUILDER</button></div><div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">{categories.filter(c => c.section === productFormData.section).length === 0 ? <div className="col-span-3 text-center text-gray-400 text-sm">등록된 카테고리가 없습니다.</div> : categories.filter(c => c.section === productFormData.section).map(c => (<label key={c.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition-colors"><input type="checkbox" className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" checked={productFormData.categories.includes(c.slug)} onChange={() => toggleCategorySelection(c.slug)} /><span className="text-sm text-gray-700">{c.name}</span></label>))}</div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">정상 판매가 (₩) *</label><input type="number" required value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">할인 적용가 (₩) <span className="text-xs text-red-500 font-normal">(선택)</span></label><input type="number" value={productFormData.sale_price} onChange={e => setProductFormData({...productFormData, sale_price: e.target.value})} className="w-full px-3 py-2 border border-red-200 rounded-lg outline-none focus:border-red-500 bg-red-50/20" placeholder="입력 시 할인가 적용" /></div>
                
                <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2">📏 사이즈 설정 (조합 존 전용)</h4>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">실제 가로 길이 (cm)</label>
                      <input type="number" step="0.1" value={productFormData.real_width_cm} onChange={e => setProductFormData({...productFormData, real_width_cm: e.target.value})} className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="예: 3.5" />
                      <p className="text-xs text-gray-500 mt-1">이 값을 기준으로 드롭존에서 크기가 자동 조절됩니다.</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-400">물체 픽셀 (자동 감지)</label>
                        {/* ✅ 재분석 버튼 */}
                        {mainImagePreviewUrl && (
                          <button type="button" onClick={() => analyzeImage(mainImagePreviewUrl)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <RefreshCw size={10} /> 재분석
                          </button>
                        )}
                      </div>
                      <input 
                        type="number" 
                        value={productFormData.object_px_width} 
                        onChange={e => setProductFormData({...productFormData, object_px_width: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {isAnalyzingImage ? "⏳ 분석 중..." : `전체 이미지: ${productFormData.image_width}px`}
                      </p>
                    </div>
                  </div>
                </div>

                <div><label className="block text-sm font-medium text-gray-700 mb-1">상태</label><select value={productFormData.status} onChange={e => setProductFormData({...productFormData, status: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"><option value="active">판매중</option><option value="sold_out">품절</option><option value="hidden">숨김</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">재고 수량</label><input type="number" value={productFormData.stock_quantity} onChange={e => setProductFormData({...productFormData, stock_quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="0" /></div>
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">메인 썸네일</label>
                   <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden group">
                     {mainImagePreviewUrl ? (
                       <>
                         <img src={mainImagePreviewUrl} className="w-full h-full object-cover" />
                         <button type="button" onClick={openCropperForMain} className="absolute bottom-1 right-1 z-10 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                           <Edit2 size={12} /> 편집
                         </button>
                       </>
                     ) : (
                       <ImageIcon className="text-gray-400" />
                     )}
                     <input type="file" accept="image/*" onChange={e => handleImageChange(e, 'main')} className="absolute inset-0 opacity-0 cursor-pointer z-0" />
                   </div>
                   {mainImagePreviewUrl && <p className="text-xs text-gray-400 mt-1">{isAnalyzingImage ? "⏳ 이미지 크기 분석 중..." : `이미지 분석 완료: ${productFormData.object_px_width}px (물체)`}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">추가 갤러리 이미지</label>
                   <div className="flex gap-2 flex-wrap">
                     {galleryItems.map((item) => (
                       <div key={item.id} className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 relative group">
                         <img src={item.previewUrl} className="w-full h-full object-cover" />
                         <button type="button" onClick={() => openCropperForGallery(item.id)} className="absolute bottom-1 left-1 bg-white/90 text-gray-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                           <Edit2 size={12} />
                         </button>
                         <button type="button" onClick={() => removeGalleryItem(item.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                       </div>
                     ))}
                     <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 relative">
                       <Plus className="text-gray-400 mb-1" />
                       <span className="text-xs text-gray-500">추가</span>
                       <input type="file" accept="image/*" multiple onChange={e => handleImageChange(e, 'gallery')} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                   </div>
                 </div>
              </div>
              <div className="pt-4 border-t border-gray-100"><label className="block text-sm font-medium text-gray-700 mb-2">상세 설명</label><RichTextEditor value={productFormData.description} onChange={val => setProductFormData({...productFormData, description: val})} placeholder="상품 설명" /></div>
              <div className="flex gap-3 pt-4 border-t border-gray-100"><button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg">취소</button><button type="submit" disabled={uploading} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700">{uploading ? '저장 중...' : '저장하기'}</button></div>
            </form>
          </div>
        </div>
      )}

      <ImageCropperModal
        open={isCropperOpen}
        imageSrc={cropImageSrc}
        aspect={1}
        title="이미지 편집"
        onCancel={closeCropper}
        onSave={handleCropSave}
      />
      
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="w-full max-w-5xl h-full flex flex-col p-8">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold text-gray-900">카테고리 관리</h2><button onClick={() => setIsCategoryManagerOpen(false)} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">닫기</button></div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8"><h3 className="text-sm font-bold text-gray-500 uppercase mb-4">새 카테고리 추가</h3><div className="flex gap-4"><input type="text" placeholder="카테고리 이름" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" /><div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden"><button onClick={() => setNewCategorySection('SHOP')} className={`px-6 py-2 font-medium transition-colors ${newCategorySection === 'SHOP' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50 text-gray-600'}`}>SHOP</button><div className="w-px bg-gray-300"></div><button onClick={() => setNewCategorySection('BUILDER')} className={`px-6 py-2 font-medium transition-colors ${newCategorySection === 'BUILDER' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}>BUILDER</button></div><button onClick={handleAddCategory} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700">+ 추가하기</button></div></div>
            <div className="flex-1 overflow-auto space-y-8">
              {['SHOP', 'BUILDER'].map(section => (
                <div key={section}>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Tag size={20} className={section === 'SHOP' ? "text-purple-600" : "text-blue-600"}/> {section} 카테고리</h3>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {categories.filter(c => c.section === section).map((cat, idx, arr) => (
                      <div key={cat.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${section === 'SHOP' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{idx + 1}</div>{editingCategoryId === cat.id ? (<div className="flex gap-2"><input type="text" value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} className="px-2 py-1 border rounded" /><button onClick={() => handleUpdateCategoryName(cat.id)} className="p-1 bg-green-100 text-green-700 rounded"><Save size={16}/></button></div>) : (<div><div className="font-bold text-gray-800 text-lg">{cat.name}</div><div className="text-xs text-gray-400">{getCategoryCount(cat.slug)}개 상품</div></div>)}</div>
                        <div className="flex items-center gap-2"><div className="flex flex-col gap-1 mr-4"><button onClick={() => handleMoveCategory(idx, 'up', arr)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30"><ChevronUp size={20}/></button><button onClick={() => handleMoveCategory(idx, 'down', arr)} disabled={idx === arr.length - 1} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30"><ChevronDown size={20}/></button></div><button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">수정</button><button onClick={() => handleDeleteCategory(cat.id)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={18}/></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
