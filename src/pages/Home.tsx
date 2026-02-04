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
import { Layers, X, Wrench } from 'lucide-react';
import html2canvas from 'html2canvas';

// 인터페이스 정의
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
    if (!data) return;
    const formattedProducts: KeyringItem[] = data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      menu_category: item.menu_category,
      sub_category: item.sub_category,
      price: item.price,
      sale_price: item.sale_price,
      status: item.status,
      image: item.image_url || item.image || '',
      description: item.description,
      gallery_images: item.gallery_images,
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

  const captureCanvasSnapshot = async (): Promise<string | null> => {
    const canvasElement = document.getElementById('canvas-drop-zone');
    if (!canvasElement) return null;

    try {
      if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvasSnapshot = await html2canvas(canvasElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        scale: 0.5,
        logging: false,
      });

      const dataUrl = canvasSnapshot.toDataURL('image/jpeg', 0.7);

      if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false);
      return dataUrl;
    } catch (error) {
      console.error('Snapshot failed:', error);
      if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false);
      return null;
    }
  };

  const handleAddToCart = async () => {
    if (canvasItems.length === 0) {
      alert('Please add items to the canvas first!');
      return;
    }

    const isMobile = window.innerWidth < 1024;
    if (isMobile && !isMobileCanvasOpen) {
       setIsMobileCanvasOpen(true);
       await new Promise(resolve => setTimeout(resolve, 300));
    }

    // ★ 현재 높이 가져오기 (없으면 기본 700)
    const currentHeight = canvasBuilderRef.current?.getHeight() || 700;
    
    const dataUrl = await captureCanvasSnapshot();
    const totalPrice = canvasItems.reduce((sum, item) => sum + item.price, 0);

    addToCart({ 
      id: 'custom-keyring-' + Date.now(), 
      name: 'Custom Keyring Set', 
      price: totalPrice, 
      image: dataUrl || '', 
      items: canvasItems,
      // ★ 높이 정보 저장
      canvasHeight: currentHeight
    } as any);

    alert('Items added to cart successfully!');
    navigate('/cart');
    setIsMobileCanvasOpen(false);
  };

  const handleCheckout = async () => { await handleAddToCart(); };

  const handleSaveDesign = async () => {
    if (!user) {
      alert('Please login to save your designs!');
      navigate('/login');
      return;
    }
    if (canvasItems.length === 0) {
      alert('Please add items to the canvas first!');
      return;
    }

    const isMobile = window.innerWidth < 1024;
    if (isMobile && !isMobileCanvasOpen) {
       setIsMobileCanvasOpen(true);
       await new Promise(resolve => setTimeout(resolve, 300));
    }

    try {
      const snapshotImage = await captureCanvasSnapshot();
      // ★ 현재 높이 가져오기
      const currentHeight = canvasBuilderRef.current?.getHeight() || 700;

      const designData = {
        items: canvasItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          image: item.image,
          canvasId: item.canvasId,
          x: item.x,
          y: item.y,
          rotation: item.rotation,
        })),
        totalPrice: canvasItems.reduce((sum, item) => sum + item.price, 0),
        // ★ 높이 정보 저장
        canvasHeight: currentHeight
      };

      const { error } = await supabase
        .from('saved_designs')
        .insert({
          user_id: user.id,
          design_name: `Design ${new Date().toLocaleDateString()}`,
          design_data: designData,
          snapshot_image: snapshotImage || '', 
        });

      if (error) throw error;
      alert('Design saved successfully!');
      
    } catch (error: any) {
      console.error('Failed to save design:', error);
      alert(`Failed to save design: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleShare = async () => {
    if (canvasItems.length === 0) { alert('Please add items!'); return; }
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      alert('Link copied to clipboard!');
    } catch (error) { console.error(error); alert('Failed to copy link.'); }
  };

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
    if (!selectedIds || selectedIds.length === 0) return null;
    const targetCategories = categories.filter(c => selectedIds.some(savedId => String(savedId) === String(c.id)));
    if (targetCategories.length === 0) return null;
    return (
      <>
        {targetCategories.map(category => {
          const categoryProducts = products.filter(product => {
             if (product.status === 'hidden') return false;
             let matchesCategory = false;
             if (Array.isArray(product.category_ids) && product.category_ids.length > 0) {
               if (product.category_ids.some(id => String(id) === String(category.id))) matchesCategory = true;
             }
             if (!matchesCategory) {
               const cCheck = product.menu_category || product.category;
               if(category.filter_type === 'ALL') matchesCategory = true;
               else if(category.filter_type === 'MIX') matchesCategory = category.included_categories?.includes(cCheck?.toUpperCase()) || false;
               else matchesCategory = cCheck?.trim().toUpperCase() === category.slug?.trim().toUpperCase();
             }
             return matchesCategory;
          });
          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id} className="mb-8 px-6 md:px-0">
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
  if (settings?.is_maintenance_mode) return <div className="flex h-screen bg-black text-white items-center justify-center"><div className="text-center"><Wrench size={40} className="mx-auto mb-4 text-white"/><h1 className="text-2xl">MAINTENANCE</h1></div></div>;

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

      <div className="max-w-[1300px] mx-auto px-0 py-0 md:px-6 md:py-4">
        {/* 1300px 기준: 오른쪽 450px 고정, 왼쪽 나머지 */}
        <div className={`grid gap-6 ${currentSection === 'BUILDER' ? 'grid-cols-1 lg:grid-cols-[1fr_450px]' : 'grid-cols-1'}`}>
          
          <div className="border-0 md:border border-white/30 p-0 md:p-6" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
            {selectedProduct ? (
              <div className="px-6 md:px-0 py-6 md:py-0"><ProductDetailView product={selectedProduct} onBack={() => setSelectedProduct(null)} /></div>
            ) : (
              <div className="space-y-4">
                {currentSection === 'SHOP' && !selectedCategory && settings?.shop_banner_images && (
                  <div className="mb-3 w-full"><ShopBannerSlider images={settings.shop_banner_images} transition="slide" speed={3000} /></div>
                )}
                {currentSection === 'BUILDER' && viewMode === 'HOME' && settings?.builder_banner_images && (
                  <div className="mb-3 w-full"><ShopBannerSlider images={settings.builder_banner_images} transition="slide" speed={3000} /></div>
                )}
                {currentSection === 'SHOP' ? (
                  !selectedCategory ? renderCategorySections(settings?.shop_home_categories) : (
                    <div className="px-6 md:px-0 mt-6"><h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">PRODUCT LIST</h2><div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={handleProductClick} onAddToCanvas={handleQuickAdd} mode="SHOP" />)}</div></div>
                  )
                ) : (
                  viewMode === 'HOME' ? renderCategorySections(settings?.builder_home_categories) : (
                    <div className="px-6 md:px-0 mt-6"><h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">PRODUCT LIST</h2><div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={handleProductClick} onAddToCanvas={handleQuickAdd} mode="BUILDER" />)}</div></div>
                  )
                )}
              </div>
            )}
          </div>

          {currentSection === 'BUILDER' && (
            <>
            <button onClick={() => setIsMobileCanvasOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#34d399] rounded-full flex items-center justify-center shadow-lg"><Layers className="text-black" size={24} /></button>
              
              {/* ★ 핵심 수정: 데스크탑(lg)에서는 무조건 relative + static 적용 */}
              <div className={`flex flex-col gap-4 ${isMobileCanvasOpen ? 'fixed inset-0 z-50 bg-black p-4 overflow-y-auto safe-area-inset-top lg:static lg:bg-transparent lg:p-0 lg:overflow-visible lg:w-full lg:relative lg:z-auto' : 'hidden lg:flex lg:relative lg:w-full lg:static'}`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/20 lg:hidden">
                  <span className="text-white font-bold text-lg">DROP ZONE</span>
                  <button onClick={() => setIsMobileCanvasOpen(false)} className="text-white hover:text-red-500"><X size={28} /></button>
                </div>
                <div className="border border-white/30 bg-black w-full" id="canvas-drop-zone">
                  <CanvasBuilder 
                    ref={canvasBuilderRef} 
                    onItemsChange={handleCanvasItemsChange} 
                    initialHeight={settings?.canvas_height || 650} 
                  />
                </div>
                <OrderSummary items={canvasItems.map(item => ({ id: item.canvasId, name: item.name, price: item.price }))} onAddToCart={handleAddToCart} onCheckout={handleCheckout} onSaveDesign={handleSaveDesign} onShare={handleShare} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};