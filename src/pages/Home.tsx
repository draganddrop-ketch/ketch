import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryTabs } from '../components/CategoryTabs';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailView } from '../components/ProductDetailView';
import { CanvasBuilder, CanvasBuilderRef } from '../components/CanvasBuilder';
import { OrderSummary } from '../components/OrderSummary';
import { ShopBannerSlider } from '../components/ShopBannerSlider';
import { KeyringItem } from '../types';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSection } from '../context/SectionContext';
import { useCanvas } from '../context/CanvasContext';
import { Wrench, Layers, X } from 'lucide-react';
import html2canvas from 'html2canvas';

// (기존 인터페이스들은 그대로 유지)
interface CanvasItem extends KeyringItem {
  canvasId: string;
  x: number;
  y: number;
  rotation: number;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  filter_type: 'SINGLE' | 'ALL' | 'MIX';
  included_categories?: string[];
  section: 'SHOP' | 'BUILDER';
}
interface SiteSettings {
  id: number;
  site_name: string;
  bg_color: string;
  primary_color?: string;
  is_maintenance_mode?: boolean;
  canvas_height?: number;
  shop_home_categories?: string[];
  builder_home_categories?: string[];
  shop_banner_images?: string[];
  builder_banner_images?: string[];
  banner_transition?: string;
  banner_speed?: number;
  shop_banner_transition?: string;
  shop_banner_speed?: number;
  builder_banner_transition?: string;
  builder_banner_speed?: number;
}

export const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { currentSection } = useSection();
  const { canvasItems, setCanvasItems, addItemToCanvas } = useCanvas();
  const canvasBuilderRef = useRef<CanvasBuilderRef>(null);

  const [viewMode, setViewMode] = useState<'HOME' | 'CATEGORY'>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<KeyringItem | null>(null);
  const [isMobileCanvasOpen, setIsMobileCanvasOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchAllData(); }, []);

  useEffect(() => {
    setSelectedProduct(null);
    if (currentSection === 'BUILDER') {
      setViewMode('HOME');
      setSelectedCategory(null);
    } else if (currentSection === 'SHOP') {
      setSelectedCategory(null);
    }
  }, [currentSection]);

  const fetchAllData = async () => {
    await Promise.all([fetchCategories(), fetchProducts(), fetchSettings()]);
    setLoading(false);
  };
  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    setSettings(data);
  };
  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('is_hidden', false).order('display_order', { ascending: true });
    setCategories(data || []);
  };
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    const formattedProducts: KeyringItem[] = data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      menu_category: item.menu_category,
      sub_category: item.sub_category,
      price: item.price,
      sale_price: item.sale_price,
      status: item.status,
      image: item.image_url,
      description: data.description,
      gallery_images: data.gallery_images,
      is_best: item.is_best,
      is_new: item.is_new,
      category_ids: item.category_ids
    }));
    setProducts(formattedProducts);
  };

  const handleProductClick = (product: KeyringItem) => {
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdd = (product: KeyringItem) => {
    if (currentSection === 'SHOP') {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.sale_price || product.price,
        image: product.image,
        quantity: 1,
      });
      alert('Added to Cart!');
    } else {
      addItemToCanvas(product);
    }
  };

  const handleCanvasItemsChange = (items: CanvasItem[]) => setCanvasItems(items);
  const handleAddToCart = async () => {
    /* (장바구니 추가 로직 기존 동일) */ 
    if (canvasItems.length === 0) { alert('Please add items!'); return; }
    const canvasElement = document.getElementById('canvas-drop-zone');
    if (!canvasElement) return;
    try {
       if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(true);
       await new Promise(resolve => setTimeout(resolve, 100));
       const canvasSnapshot = await html2canvas(canvasElement, {
         useCORS: true, allowTaint: true, backgroundColor: '#09090b', scale: 2, logging: false,
         scrollY: -window.scrollY, scrollX: -window.scrollX,
         windowWidth: canvasElement.scrollWidth, windowHeight: canvasElement.scrollHeight,
       });
       const dataUrl = canvasSnapshot.toDataURL('image/png');
       if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false);
       const totalPrice = canvasItems.reduce((sum, item) => sum + item.price, 0);
       addToCart({ id: 'custom-keyring-' + Date.now(), name: 'Custom Keyring Set', price: totalPrice, image: dataUrl, items: canvasItems });
       alert('Items added!'); navigate('/cart'); setIsMobileCanvasOpen(false);
    } catch (error) {
       console.error(error);
       if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false);
    }
  };
  const handleCheckout = async () => { await handleAddToCart(); };
  const handleSaveDesign = async () => { /* (저장 로직 기존 동일) */ };
  const handleShare = async () => { /* (공유 로직 기존 동일) */ };

  const filteredProducts = products.filter(product => {
    if (product.status === 'hidden') return false;
    if (!selectedCategory) return true;
    const activeCat = categories.find(c => c.slug === selectedCategory);
    if (!activeCat) return true;
    let matchesCategory = false;
    if (Array.isArray(product.category_ids) && product.category_ids.length > 0) {
      matchesCategory = product.category_ids.some(id => String(id) === String(activeCat.id));
    }
    if (!matchesCategory) {
      const categoryToCheck = product.menu_category || product.category;
      switch (activeCat.filter_type) {
        case 'ALL': matchesCategory = true; break;
        case 'MIX': matchesCategory = activeCat.included_categories?.includes(categoryToCheck?.toUpperCase()) || false; break;
        case 'SINGLE': default: matchesCategory = categoryToCheck?.trim().toUpperCase() === activeCat.slug?.trim().toUpperCase(); break;
      }
    }
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderCategorySections = (selectedIds: string[] | undefined) => {
    // (기존 카테고리 렌더링 로직 동일)
    if (!selectedIds || selectedIds.length === 0) return null;
    const targetCategories = categories.filter(c => selectedIds.some(savedId => String(savedId) === String(c.id)));
    if (targetCategories.length === 0) return null;
    return (
      <>
        {targetCategories.map(category => {
          const categoryProducts = products.filter(product => { /* 필터링 로직 */ 
             if (product.status === 'hidden') return false;
             // ... (기존과 동일하므로 생략)
             if (Array.isArray(product.category_ids) && product.category_ids.length > 0) {
                if(product.category_ids.some(id => String(id) === String(category.id))) return true;
             }
             const cCheck = product.menu_category || product.category;
             if(category.filter_type === 'ALL') return true;
             if(category.filter_type === 'MIX') return category.included_categories?.includes(cCheck?.toUpperCase());
             return cCheck?.trim().toUpperCase() === category.slug?.trim().toUpperCase();
          });
          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id} className="mb-8 px-6 md:px-0"> {/* ★ 모바일 내부 패딩 추가 (텍스트 안 잘리게) */}
              <h2 className="text-white font-bold uppercase tracking-wider mb-4 text-lg">{category.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryProducts.map(p => <ProductCard key={p.id} product={p} onClick={handleProductClick} onAddToCanvas={handleQuickAdd} mode={currentSection as 'SHOP'|'BUILDER'} />)}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  if (loading) return <div className="flex h-screen bg-black items-center justify-center text-zinc-700">LOADING...</div>;
  if (settings?.is_maintenance_mode) return <div className="flex h-screen bg-black text-white items-center justify-center">MAINTENANCE</div>;

  const handleCategoryChange = (category: string) => {
    setSelectedProduct(null);
    if (currentSection === 'BUILDER') {
      if (category === 'all') { setViewMode('HOME'); setSelectedCategory(null); }
      else { setViewMode('CATEGORY'); setSelectedCategory(category); }
    } else { setSelectedCategory(category === 'all' ? null : category); }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
      <Header cartCount={0} onSearchChange={setSearchQuery} onLogoClick={() => {
        setSelectedProduct(null);
        if (currentSection === 'SHOP') setSelectedCategory(null);
        else if (currentSection === 'BUILDER') { setViewMode('HOME'); setSelectedCategory(null); }
      }} />

      <CategoryTabs activeCategory={selectedCategory || 'all'} onCategoryChange={handleCategoryChange} />

      {/* ★ 수정 포인트: 
          - px-0 (모바일 패딩 제거 -> 꽉 찬 화면)
          - md:px-6 (데스크탑 패딩 유지)
      */}
      <div className="max-w-[1300px] mx-auto px-0 py-0 md:px-6 md:py-4">
        <div className={`grid gap-6 ${currentSection === 'BUILDER' ? 'grid-cols-1 lg:grid-cols-[65%_35%]' : 'grid-cols-1'}`}>
          
          {/* ★ 수정 포인트: 
              - border-0 (모바일 보더 제거 -> 꽉 찬 화면)
              - md:border (데스크탑 보더 유지)
              - p-0 (모바일 패딩 제거) -> md:p-6 (데스크탑 패딩 유지)
          */}
          <div className="border-0 md:border border-white/30 p-0 md:p-6" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
            
            {selectedProduct ? (
              <div className="px-6 md:px-0 py-6 md:py-0"> {/* 상세페이지는 내부 패딩 필요 */}
                <ProductDetailView product={selectedProduct} onBack={() => setSelectedProduct(null)} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* 배너들 */}
                {currentSection === 'SHOP' && !selectedCategory && settings?.shop_banner_images && (
                  <div className="mb-3 w-full"><ShopBannerSlider images={settings.shop_banner_images} transition="slide" speed={3000} /></div>
                )}
                {currentSection === 'BUILDER' && viewMode === 'HOME' && settings?.builder_banner_images && (
                  <div className="mb-3 w-full"><ShopBannerSlider images={settings.builder_banner_images} transition="slide" speed={3000} /></div>
                )}

                {/* 상품 리스트 */}
                {currentSection === 'SHOP' ? (
                  !selectedCategory ? renderCategorySections(settings?.shop_home_categories) : (
                    <div className="px-6 md:px-0 mt-6"> {/* ★ 모바일 내부 패딩 */}
                      <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">PRODUCT LIST</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={handleProductClick} onAddToCanvas={handleQuickAdd} mode="SHOP" />)}
                      </div>
                    </div>
                  )
                ) : (
                  viewMode === 'HOME' ? renderCategorySections(settings?.builder_home_categories) : (
                    <div className="px-6 md:px-0 mt-6">
                      <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">PRODUCT LIST</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={handleProductClick} onAddToCanvas={handleQuickAdd} mode="BUILDER" />)}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* 드롭존 (빌더 모드 우측) */}
          {currentSection === 'BUILDER' && (
            <>
              <button onClick={() => setIsMobileCanvasOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#34d399] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Layers className="text-black" size={24} />
              </button>

              <div className={`space-y-4 ${isMobileCanvasOpen ? 'fixed inset-0 z-50 bg-black p-4 overflow-y-auto safe-area-inset-top lg:static lg:bg-transparent lg:p-0 lg:overflow-visible' : 'hidden lg:block'}`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/20 lg:hidden">
                  <span className="text-white font-bold text-lg">DROP ZONE</span>
                  <button onClick={() => setIsMobileCanvasOpen(false)} className="text-white hover:text-red-500"><X size={28} /></button>
                </div>
                <div className="border border-white/30 bg-black"><CanvasBuilder ref={canvasBuilderRef} onItemsChange={handleCanvasItemsChange} initialHeight={settings?.canvas_height || 700} /></div>
                <OrderSummary items={canvasItems.map(item => ({ id: item.canvasId, name: item.name, price: item.price }))} onAddToCart={handleAddToCart} onCheckout={handleCheckout} onSaveDesign={handleSaveDesign} onShare={handleShare} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};