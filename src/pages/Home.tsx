import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ✅ URL 파라미터 훅 추가
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
import { Layers, X, Wrench, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- 인터페이스 정의 ---
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
  
  // 카테고리 설정
  shop_home_categories?: string[];
  builder_home_categories?: string[];
  
  // 배너 이미지
  shop_banner_images?: string[];
  builder_banner_images?: string[];
  
  // 배너 옵션
  banner_transition?: string;
  banner_speed?: number;
  shop_banner_transition?: string;
  shop_banner_speed?: number;
  builder_banner_transition?: string;
  builder_banner_speed?: number;

  // 상품 카드 디자인 (Style - 색상)
  product_card_bg?: string;
  product_text_color?: string;
  product_sub_text_color?: string;
  product_accent_color?: string;

  // 상품 카드 디자인 (Style - 폰트 크기)
  product_name_size?: number;
  product_category_size?: number;
  product_price_size?: number;
}

// ✅ [추가됨] Data URI(base64 문자열)를 Blob(파일 객체)으로 변환하는 헬퍼 함수
const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ✅ URL 쿼리 파라미터 읽기
  
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { currentSection } = useSection();
  const { canvasItems, setCanvasItems, addItemToCanvas } = useCanvas();
  const canvasBuilderRef = useRef<CanvasBuilderRef>(null);

  // UI 상태
  const [viewMode, setViewMode] = useState<'HOME' | 'CATEGORY'>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<KeyringItem | null>(null);
  const [isMobileCanvasOpen, setIsMobileCanvasOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 데이터 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => { fetchAllData(); }, []);

  // ✅ URL에 검색어가 있으면 상태 업데이트 (헤더 검색 기능 연동)
  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

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
      category_ids: item.category_ids || (item.category ? [item.category] : []),
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
      stock_quantity: item.stock_quantity
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
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
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

    const currentHeight = canvasBuilderRef.current?.getHeight() || 700;
    const dataUrl = await captureCanvasSnapshot();
    const totalPrice = canvasItems.reduce((sum, item) => sum + item.price, 0);

    addToCart({ 
      id: 'custom-keyring-' + Date.now(), 
      name: 'Custom Keyring Set', 
      price: totalPrice, 
      image: dataUrl || '', 
      items: canvasItems,
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

  // ✅ [수정됨] 캔버스 이미지를 SNS로 공유하는 기능 (Web Share API)
  const handleShareImage = async () => {
    if (canvasItems.length === 0) {
      alert('캔버스에 아이템이 없습니다!');
      return;
    }
    
    // 로딩 표시 대신 간단히 알림 (필요시 커스텀 로딩 추가 가능)
    // setLoading(true); 

    try {
      // 1. 캔버스 캡처
      const dataUrl = await captureCanvasSnapshot();
      if (!dataUrl) throw new Error('이미지 캡처 실패');

      // 2. DataURL을 파일(Blob)로 변환
      const blob = dataURItoBlob(dataUrl);
      const file = new File([blob], 'my-design.png', { type: 'image/png' });

      // 3. Web Share API 지원 여부 확인 및 실행
      if (navigator.share && navigator.canShare({ files: [file] })) {
        // 모바일 등 공유 API를 지원하는 경우 -> 네이티브 공유 시트 열기
        await navigator.share({
          title: '나만의 키링 디자인',
          text: '내가 만든 멋진 키링 디자인을 확인해보세요!',
          files: [file],
        });
      } else {
        // 4. (PC 등) 공유 API를 지원하지 않는 경우 -> 이미지 다운로드로 대체
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `design-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('이미지가 다운로드되었습니다. 인스타그램/SNS 앱을 열어 공유해주세요!');
      }

    } catch (error: any) {
      console.error('공유 실패:', error);
      // 사용자가 공유 창을 닫은 경우는 에러로 처리하지 않음
      if (error.name !== 'AbortError') {
        alert('이미지 공유에 실패했습니다.');
      }
    } finally {
      // setLoading(false);
    }
  };

  // ✅ 카테고리 필터링 로직 (다중 카테고리 지원 + 검색어 연동)
  const filteredProducts = products.filter(product => {
    if (product.status === 'hidden') return false;
    
    if (!selectedCategory || selectedCategory === 'all') return true;

    const activeCat = categories.find(c => c.slug === selectedCategory);
    const productCatIds = product.category_ids || [product.category];

    let matchesCategory = false;

    if (activeCat) {
      if (activeCat.filter_type === 'MIX' && activeCat.included_categories) {
        matchesCategory = activeCat.included_categories.some(mixedSlug => 
          productCatIds.includes(mixedSlug.toLowerCase())
        );
      } else {
        matchesCategory = productCatIds.includes(selectedCategory);
      }
    } else {
      matchesCategory = productCatIds.includes(selectedCategory);
    }

    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ✅ 메인 화면 섹션 렌더링 로직 (설정 전달 추가)
  const renderCategorySections = (selectedIds: string[] | undefined) => {
    if (!selectedIds || selectedIds.length === 0) return null;
    
    const targetCategories = categories.filter(c => selectedIds.some(savedId => String(savedId) === String(c.id)));
    if (targetCategories.length === 0) return null;

    return (
      <>
        {targetCategories.map(category => {
          const categoryProducts = products.filter(product => {
             if (product.status === 'hidden') return false;
             
             const productCatIds = product.category_ids || [product.category];
             let matchesCategory = productCatIds.includes(category.slug);

             if (!matchesCategory && category.filter_type === 'MIX' && category.included_categories) {
               matchesCategory = category.included_categories.some(mixedSlug => 
                 productCatIds.includes(mixedSlug.toLowerCase())
               );
             }
             if (category.filter_type === 'ALL') {
               matchesCategory = true;
             }
             return matchesCategory;
          });

          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} className="mb-8 px-6 md:px-0">
              <h2 className="text-white font-bold uppercase tracking-wider mb-4 text-lg">{category.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryProducts.map(p => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    onClick={handleProductClick} 
                    onAddToCanvas={handleQuickAdd} 
                    mode={currentSection as 'SHOP'|'BUILDER'}
                    customStyle={{
                      bg: settings?.product_card_bg,
                      text: settings?.product_text_color,
                      subText: settings?.product_sub_text_color,
                      accent: settings?.product_accent_color,
                      nameSize: settings?.product_name_size,
                      catSize: settings?.product_category_size,
                      priceSize: settings?.product_price_size
                    }}
                  />
                ))}
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
      
      {/* ✅ 1. Sticky Header (검색 기능 연동됨) */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
        <Header 
          cartCount={0} 
          onSearchChange={setSearchQuery} // 여기서 검색어 상태를 직접 받음
          onLogoClick={() => {
            setSelectedProduct(null);
            if (currentSection === 'SHOP') setSelectedCategory(null);
            else if (currentSection === 'BUILDER') { setViewMode('HOME'); setSelectedCategory(null); }
          }} 
        />
      </div>

      {/* ✅ 2. Sticky Category Tabs (헤더 바로 아래 고정) */}
      <div className="sticky top-[60px] z-40" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
        <CategoryTabs activeCategory={selectedCategory || 'all'} onCategoryChange={handleCategoryChange} />
      </div>

      <div className="max-w-[1300px] mx-auto px-2 py-2 md:px-6 md:py-4 relative z-0">
        <div className={`grid gap-6 ${currentSection === 'BUILDER' ? 'grid-cols-1 lg:grid-cols-[1fr_35%]' : 'grid-cols-1'}`}>
          
          <div className="border-0 md:border border-white/30 p-0 md:p-6" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
            {selectedProduct ? (
              <div className="px-6 md:px-0 py-6 md:py-0"><ProductDetailView product={selectedProduct} onBack={() => setSelectedProduct(null)} /></div>
            ) : (
              <div className="space-y-4">
                {/* 배너 슬라이더 (설정 적용) */}
                {currentSection === 'SHOP' && !selectedCategory && settings?.shop_banner_images && (
                  <div className="mb-3 w-full">
                    <ShopBannerSlider 
                      images={settings.shop_banner_images} 
                      transition={settings.shop_banner_transition || 'slide'} 
                      speed={settings.shop_banner_speed || 3000} 
                    />
                  </div>
                )}
                {currentSection === 'BUILDER' && viewMode === 'HOME' && settings?.builder_banner_images && (
                  <div className="mb-3 w-full">
                    <ShopBannerSlider 
                      images={settings.builder_banner_images} 
                      transition={settings.builder_banner_transition || 'slide'} 
                      speed={settings.builder_banner_speed || 3000} 
                    />
                  </div>
                )}

                {/* 상품 목록 (설정 전달) */}
                {currentSection === 'SHOP' ? (
                  !selectedCategory ? renderCategorySections(settings?.shop_home_categories) : (
                    <div className="px-6 md:px-0 mt-6">
                      <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">PRODUCT LIST</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                          <ProductCard 
                            key={p.id} 
                            product={p} 
                            onClick={handleProductClick} 
                            onAddToCanvas={handleQuickAdd} 
                            mode="SHOP" 
                            customStyle={{
                              bg: settings?.product_card_bg,
                              text: settings?.product_text_color,
                              subText: settings?.product_sub_text_color,
                              accent: settings?.product_accent_color,
                              nameSize: settings?.product_name_size,
                              catSize: settings?.product_category_size,
                              priceSize: settings?.product_price_size
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  viewMode === 'HOME' ? renderCategorySections(settings?.builder_home_categories) : (
                    <div className="px-6 md:px-0 mt-6">
                      <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">PRODUCT LIST</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                          <ProductCard 
                            key={p.id} 
                            product={p} 
                            onClick={handleProductClick} 
                            onAddToCanvas={handleQuickAdd} 
                            mode="BUILDER"
                            customStyle={{
                              bg: settings?.product_card_bg,
                              text: settings?.product_text_color,
                              subText: settings?.product_sub_text_color,
                              accent: settings?.product_accent_color,
                              nameSize: settings?.product_name_size,
                              catSize: settings?.product_category_size,
                              priceSize: settings?.product_price_size
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {currentSection === 'BUILDER' && (
            <>
              {/* 드롭존 컨테이너 */}
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
                <OrderSummary 
                  items={canvasItems.map(item => ({ id: item.canvasId, name: item.name, price: item.price }))} 
                  onAddToCart={handleAddToCart} 
                  onCheckout={handleCheckout} 
                  onSaveDesign={handleSaveDesign} 
                  onShare={handleShareImage} // ✅ 수정됨: SNS 공유 함수 연결
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모바일 플로팅 버튼 */}
      {currentSection === 'BUILDER' && (
        <button 
          onClick={() => setIsMobileCanvasOpen(true)} 
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#34d399] rounded-full flex items-center justify-center shadow-lg"
        >
          <Layers className="text-black" size={24} />
          {canvasItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-black">
              {canvasItems.length}
            </span>
          )}
        </button>
      )}

      {/* 토스트 알림 */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
           <div className="bg-black/90 text-white border border-white/20 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
              <Check size={16} className="text-[#34d399]" />
              <span className="text-sm font-bold">드롭존에 추가되었습니다</span>
           </div>
        </div>
      )}
    </div>
  );
};