import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Layers, X, Check, ArrowRight } from 'lucide-react';
import html2canvas from 'html2canvas';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

interface CanvasItem extends KeyringItem { canvasId: string; x: number; y: number; rotation: number; }
interface Category { id: string; name: string; slug: string; display_order: number; filter_type: 'SINGLE' | 'ALL' | 'MIX'; included_categories?: string[]; section: 'SHOP' | 'BUILDER'; }

const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); }
  return new Blob([ab], { type: mimeString });
};

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTextParam = searchParams.get('search') || '';
  const productParam = searchParams.get('product');
  const categoryParam = searchParams.get('category');
  const sectionParam = searchParams.get('section');
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { currentSection, setCurrentSection } = useSection();
  const { canvasItems, setCanvasItems, addItemToCanvas } = useCanvas();
  const { settings, getBorderStyle } = useSiteSettings(); 
  const canvasBuilderRef = useRef<CanvasBuilderRef>(null);
  const hasSectionInitialized = useRef(false);

  const [viewMode, setViewMode] = useState<'HOME' | 'CATEGORY'>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<KeyringItem | null>(null);
  const [isMobileCanvasOpen, setIsMobileCanvasOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);

  // 전역 스타일 연동
  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';
  const globalBorder = settings?.layout_border_color || 'rgba(255, 255, 255, 0.3)';
  const borderStyle = getBorderStyle();
  const canvasBgColor = settings?.canvas_bg_color || '#FFFFFF';

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => {
    setSearchQuery(searchTextParam);
  }, [searchTextParam]);

  useEffect(() => {
    if (!sectionParam) return;
    const normalized = sectionParam.toLowerCase();
    if (normalized !== 'shop' && normalized !== 'builder') return;
    const desired = normalized === 'builder' ? 'BUILDER' : 'SHOP';
    if (desired !== currentSection) setCurrentSection(desired);
  }, [sectionParam]);

  useEffect(() => {
    const desiredParam = currentSection === 'BUILDER' ? 'builder' : 'shop';
    if (!sectionParam) {
      updateUrlQuery({ section: desiredParam }, { replace: true });
      return;
    }
    if (sectionParam !== desiredParam) {
      updateUrlQuery({ section: desiredParam, category: null, product: null }, { replace: false });
    }
  }, [currentSection]);

  useEffect(() => {
    if (!productParam) {
      setSelectedProduct(null);
      return;
    }

    const targetProduct = products.find((product) => product.id === productParam) || null;
    setSelectedProduct(targetProduct);
    if (targetProduct) window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (products.length > 0) updateUrlQuery({ product: null }, { replace: true });
  }, [productParam, products]);
  useEffect(() => { 
    if (hasSectionInitialized.current && productParam) {
      closeProductDetail({ replace: true });
    }
    hasSectionInitialized.current = true;
    if (currentSection === 'BUILDER') { setViewMode('HOME'); setSelectedCategory(null); } 
    else if (currentSection === 'SHOP') { setSelectedCategory(null); } 
  }, [currentSection]);

  useEffect(() => {
    if (!categoryParam) {
      setSelectedCategory(null);
      if (currentSection === 'BUILDER') setViewMode('HOME');
      return;
    }
    const normalized = categoryParam.toLowerCase();
    const category = categories.find((c) => c.slug.toLowerCase() === normalized && c.section === currentSection);
    if (!category) {
      if (categories.length > 0) updateUrlQuery({ category: null }, { replace: true });
      return;
    }
    setSelectedCategory(category.slug);
    if (currentSection === 'BUILDER') setViewMode('CATEGORY');
  }, [categoryParam, categories, currentSection]);

  const fetchAllData = async () => { await Promise.all([fetchCategories(), fetchProducts()]); setLoading(false); };
  const fetchCategories = async () => { const { data } = await supabase.from('categories').select('*').eq('is_hidden', false).order('display_order', { ascending: true }); setCategories(data || []); };
  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (!data) return;

    const formatted: KeyringItem[] = data.map((item) => {
      const thumbnailImage = item.image_url || item.image || '';
      const dropzoneImage = item.dropzone_image_url || thumbnailImage;
      return {
        ...item,
        id: item.id,
        name: item.name,
        category: item.category,
        category_ids: item.category_ids || [item.category],
        price: item.price,
        sale_price: item.sale_price,
        status: item.status,
        image: thumbnailImage,
        image_url: thumbnailImage,
        dropzone_image_url: dropzoneImage,
        description: item.description,
        short_description: item.short_description,
        gallery_images: item.gallery_images,
        is_best: item.is_best,
        is_new: item.is_new,
        stock_quantity: item.stock_quantity
      };
    });

    setProducts(formatted);
  };

  const updateUrlQuery = (updates: Record<string, string | null>, options?: { replace?: boolean }) => {
    const baseParams = typeof window === 'undefined'
      ? new URLSearchParams(searchParams)
      : new URLSearchParams(window.location.search);
    const nextParams = new URLSearchParams(baseParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) nextParams.delete(key);
      else nextParams.set(key, value);
    });

    setSearchParams(nextParams, { replace: options?.replace });
  };

  const handleProductClick = (product: KeyringItem) => {
    navigate(`/product/${product.id}`);
  };

  const closeProductDetail = (options?: { replace?: boolean }) => {
    setSelectedProduct(null);
    if (!productParam) return;
    updateUrlQuery({ product: null }, { replace: options?.replace ?? true });
  };

  const clearCategorySelection = (options?: { replace?: boolean }) => {
    setSelectedCategory(null);
    if (currentSection === 'BUILDER') setViewMode('HOME');
    if (!categoryParam) return;
    updateUrlQuery({ category: null }, { replace: options?.replace ?? true });
  };
  const handleQuickAdd = (product: KeyringItem) => { if (currentSection === 'SHOP') { addToCart({ id: product.id, name: product.name, price: product.sale_price || product.price, image: product.image, quantity: 1 }); alert('Added to Cart!'); } else { addItemToCanvas(product); setShowToast(true); setTimeout(() => setShowToast(false), 2000); } };
  const handleCanvasItemsChange = (items: CanvasItem[]) => setCanvasItems(items);
  
  const captureCanvasSnapshot = async (): Promise<string | null> => { const el = document.getElementById('canvas-drop-zone'); if (!el) return null; try { if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(true); await new Promise(r => setTimeout(r, 100)); const snap = await html2canvas(el, { useCORS: true, allowTaint: true, backgroundColor: canvasBgColor, scale: 0.5, logging: false }); const url = snap.toDataURL('image/jpeg', 0.7); if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false); return url; } catch (e) { console.error(e); if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false); return null; } };
  
  const handleAddToCart = async () => { if (canvasItems.length === 0) return alert('Empty canvas!'); const isMobile = window.innerWidth < 1024; if (isMobile && !isMobileCanvasOpen) { setIsMobileCanvasOpen(true); await new Promise(r => setTimeout(r, 300)); } const h = canvasBuilderRef.current?.getHeight() || 700; const url = await captureCanvasSnapshot(); const total = canvasItems.reduce((s, i) => s + i.price, 0); addToCart({ id: 'custom-' + Date.now(), name: 'Custom Set', price: total, image: url || '', items: canvasItems, canvasHeight: h } as any); alert('Added!'); navigate('/cart'); setIsMobileCanvasOpen(false); };
  const handleCheckout = async () => { await handleAddToCart(); };
  
  const handleSaveDesign = async () => { 
    if (!user) { alert('Login needed'); navigate('/login'); return; } 
    if (canvasItems.length === 0) return alert('Empty'); 
    
    const img = await captureCanvasSnapshot(); 
    const h = canvasBuilderRef.current?.getHeight() || 700; 
    
    const design = { 
      items: canvasItems.map(i => ({ 
        id: i.id, 
        name: i.name, 
        category: i.category, 
        price: i.price, 
        image: i.image, 
        canvasId: i.canvasId, 
        x: i.x, 
        y: i.y, 
        rotation: i.rotation,
        real_width_cm: i.real_width_cm,
        object_px_width: i.object_px_width,
        image_width: i.image_width
      })), 
      totalPrice: canvasItems.reduce((s, i) => s + i.price, 0), 
      canvasHeight: h 
    }; 
    
    const { error } = await supabase.from('saved_designs').insert({ user_id: user.id, design_name: `Design ${new Date().toLocaleDateString()}`, design_data: design, snapshot_image: img || '' }); 
    if (error) alert('Error'); else alert('Design Saved!'); 
  };

  const handleShareImage = async () => { if (canvasItems.length === 0) return alert('Empty'); try { const url = await captureCanvasSnapshot(); if (!url) throw new Error('Fail'); const file = new File([dataURItoBlob(url)], 'design.png', { type: 'image/png' }); if (navigator.share && navigator.canShare({ files: [file] })) await navigator.share({ title: 'My Design', files: [file] }); else { const a = document.createElement('a'); a.href = url; a.download = `design-${Date.now()}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); alert('Downloaded!'); } } catch (e) { alert('Share failed'); } };

  const getProductsByCategoryId = (catId: string) => { const category = categories.find(c => String(c.id) === String(catId)); if (!category) return []; return products.filter(p => (p.category_ids || [p.category]).includes(category.slug)); };
  
  const filteredProducts = products.filter(p => { 
    if (p.status === 'hidden') return false; 
    if (!selectedCategory || selectedCategory === 'all') return true; 
    const catIds = p.category_ids || (p.category ? [p.category] : []); 
    return catIds.includes(selectedCategory) && (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())); 
  });

  const renderCategorySections = (selectedIds: string[] | undefined) => {
    if (!selectedIds || selectedIds.length === 0) return null;
    const uniqueIds = Array.from(new Set(selectedIds));
    const targetCategories = uniqueIds.map(id => categories.find(c => String(c.id) === String(id))).filter((c): c is Category => !!c);
    if (targetCategories.length === 0) return null;
    return (
      <div className="space-y-12">
        {targetCategories.map(category => {
          const categoryProducts = products.filter(product => {
             if (product.status === 'hidden') return false;
             const productCatIds = product.category_ids || [product.category];
             let matchesCategory = productCatIds.includes(category.slug);
             if (!matchesCategory && category.filter_type === 'MIX' && category.included_categories) matchesCategory = category.included_categories.some(mixedSlug => productCatIds.includes(mixedSlug.toLowerCase()));
             if (category.filter_type === 'ALL') matchesCategory = true;
             return matchesCategory;
          });
          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id} className="px-0">
              <div className="flex justify-between items-end mb-4 border-b pb-2" style={{ borderColor: globalBorder }}>
                <h2 className="font-bold uppercase tracking-wider text-sm" style={{ color: globalText }}>{category.name}</h2>
                <button onClick={() => handleCategoryChange(category.slug)} className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1" style={{ color: globalText }}>VIEW ALL <ArrowRight size={12}/></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryProducts.slice(0, 8).map(p => (
                  <ProductCard key={p.id} product={p} onClick={handleProductClick} onAddToCanvas={handleQuickAdd} mode="BUILDER" customStyle={{ bg: settings?.product_card_bg, text: settings?.product_text_color, subText: settings?.product_sub_text_color, accent: settings?.product_accent_color, nameSize: settings?.product_name_size, catSize: settings?.product_category_size, priceSize: settings?.product_price_size }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderShopLayout = () => {
    const slot1 = settings?.shop_slot1_images?.length ? settings.shop_slot1_images : ['https://via.placeholder.com/550x700/222/fff?text=Slot+1'];
    const slot2 = settings?.shop_slot2_images?.length ? settings.shop_slot2_images : ['https://via.placeholder.com/550x700/333/fff?text=Slot+2'];
    const slot3 = settings?.shop_slot3_images?.length ? settings.shop_slot3_images : ['https://via.placeholder.com/550x700/444/fff?text=Slot+3'];
    
    const transitionEffect = settings?.banner_transition === 'fade' ? 'fade' : 'slide';
    const speed = settings?.banner_speed || 3000;

    const commonSwiperProps = {
      modules: [Autoplay, EffectFade, Pagination],
      effect: transitionEffect === 'fade' ? 'fade' : 'slide',
      autoplay: { delay: speed, disableOnInteraction: false },
      pagination: { clickable: true, dynamicBullets: true },
      loop: true,
      className: "w-full h-full"
    };

    return (
      <div className="w-full pt-4 px-4 md:px-6">
        <div className="w-full mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full h-auto bg-transparent overflow-hidden relative group rounded-sm"><Swiper {...commonSwiperProps}>{slot1.map((src, idx) => (<SwiperSlide key={`s1-${idx}`}><img src={src} className="w-full h-auto object-contain" alt="Slot 1" /></SwiperSlide>))}</Swiper></div>
            <div className="w-full h-auto bg-transparent overflow-hidden relative group rounded-sm"><Swiper {...commonSwiperProps}>{slot2.map((src, idx) => (<SwiperSlide key={`s2-${idx}`}><img src={src} className="w-full h-auto object-contain" alt="Slot 2" /></SwiperSlide>))}</Swiper></div>
            <div className="w-full h-auto bg-transparent overflow-hidden relative group rounded-sm"><Swiper {...commonSwiperProps}>{slot3.map((src, idx) => (<SwiperSlide key={`s3-${idx}`}><img src={src} className="w-full h-auto object-contain" alt="Slot 3" /></SwiperSlide>))}</Swiper></div>
          </div>
        </div>
        <div className="w-full mt-12">{renderCategorySections(settings?.shop_home_categories)}</div>
      </div>
    );
  };

  if (loading) return <div className="flex h-screen bg-black items-center justify-center text-zinc-700">LOADING...</div>;
  if (settings?.is_maintenance_mode) return <div className="flex h-screen bg-black text-white items-center justify-center"><div className="text-center"><Wrench size={40} className="mx-auto mb-4 text-white"/><h1 className="text-2xl">MAINTENANCE</h1></div></div>;

  const handleCategoryChange = (category: string) => {
    closeProductDetail();
    const sectionValue = currentSection === 'BUILDER' ? 'builder' : 'shop';
    updateUrlQuery({ section: sectionValue, category });
    if (currentSection === 'BUILDER') {
      setViewMode('CATEGORY');
    }
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerContent = (settings?.footer_content || '').trim();

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: globalBg, color: globalText }}>
      
      {/* 1. Header Wrapper (Sticky) */}
      {/* ✅ border-b 제거 (로고 아래 선 삭제) */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b-0">
        <Header
          cartCount={0}
          onSearchChange={setSearchQuery}
          onLogoClick={() => {
            closeProductDetail();
            clearCategorySelection();
          }}
        />
      </div>
      
      {/* 2. CategoryTabs Wrapper (Relative - Not Sticky) */}
      {/* ✅ sticky 제거 -> 스크롤 시 위로 사라짐 */}
      <div className="sticky z-40 w-full" style={{ top: 'var(--header-offset, 0px)', backgroundColor: 'transparent' }}>
        <CategoryTabs activeCategory={selectedCategory || 'all'} onCategoryChange={handleCategoryChange} />
      </div>

      {currentSection === 'SHOP' && !selectedProduct && !selectedCategory ? (
        renderShopLayout()
      ) : (
        <div className="w-full px-4 md:px-6 pt-[8px] pb-20 relative z-0">
          
          {currentSection === 'SHOP' && selectedCategory && !selectedProduct && (
            <div className="px-0 mt-0">
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
          )}

          {(currentSection === 'BUILDER' || selectedProduct) && (
            <div className={`grid gap-6 ${currentSection === 'BUILDER' ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)]' : 'grid-cols-1'}`}>
              
              <div
                className={`${currentSection === 'BUILDER' || selectedProduct ? 'border-0' : 'border'} p-0`}
                style={{ backgroundColor: globalBg, borderColor: globalBorder }}
              >
                {selectedProduct ? (
                  <div className="px-0 py-6 md:py-0"><ProductDetailView product={selectedProduct} onBack={closeProductDetail} /></div>
                ) : (
                  <div className="space-y-4">
                    {viewMode === 'HOME' && settings?.builder_banner_images && (
                      <div className="w-full mb-5">
                        <ShopBannerSlider images={settings.builder_banner_images} transition={settings.builder_banner_transition} speed={settings.builder_banner_speed} />
                      </div>
                    )}
                    
                    {viewMode === 'HOME' ? (renderCategorySections(settings?.builder_home_categories)) : (
                      <div className="px-0 mt-0">
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
                    )}
                  </div>
                )}
              </div>

              {currentSection === 'BUILDER' && (
                <div className={`flex flex-col gap-4 ${isMobileCanvasOpen ? 'fixed inset-0 z-50 bg-black p-4 overflow-y-auto safe-area-inset-top lg:static lg:bg-transparent lg:p-0 lg:overflow-visible lg:w-full lg:relative lg:z-auto' : 'hidden lg:flex lg:relative lg:w-full lg:static'} lg:justify-self-end`}>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b lg:hidden" style={{ borderColor: globalBorder }}>
                    <span className="font-bold text-lg" style={{ color: globalText }}>DROP ZONE</span>
                    <button onClick={() => setIsMobileCanvasOpen(false)} className="text-white hover:text-red-500"><X size={28} /></button>
                  </div>
                  <div className="border bg-black w-full max-w-[450px]" id="canvas-drop-zone" style={{ borderColor: globalBorder }}>
                    <CanvasBuilder ref={canvasBuilderRef} onItemsChange={handleCanvasItemsChange} initialHeight={settings?.canvas_height || 650} />
                  </div>
                  <OrderSummary items={canvasItems.map(item => ({ id: item.canvasId, name: item.name, price: item.price }))} onAddToCart={handleAddToCart} onCheckout={handleCheckout} onSaveDesign={handleSaveDesign} onShare={handleShareImage} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentSection === 'SHOP' && (
        <footer className="mt-20 border-t" style={borderStyle}>
          <div className="px-4 md:px-6 py-12">
            <div className="max-w-6xl mx-auto min-h-[84px] text-xs md:text-sm leading-relaxed whitespace-pre-line opacity-80" style={{ color: globalText }}>
              {footerContent}
            </div>
          </div>
        </footer>
      )}

      {currentSection === 'BUILDER' && (
        <button onClick={() => setIsMobileCanvasOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[var(--accent-color)] rounded-full flex items-center justify-center shadow-lg"><Layers className="text-black" size={24} /></button>
      )}
      {showToast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"><div className="bg-black/90 text-white border border-white/20 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce"><Check size={16} className="text-[var(--accent-color)]" /><span className="text-sm font-bold">드롭존에 추가되었습니다</span></div></div>}
    </div>
  );
};
