import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailView } from '../components/ProductDetailView';
import { CanvasBuilder, CanvasBuilderRef } from '../components/CanvasBuilder';
import { OrderSummary } from '../components/OrderSummary';
import { ShopBannerSlider } from '../components/ShopBannerSlider';
import { FloatingFooter } from '../components/FloatingFooter';
import { KeyringItem } from '../types';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../context/CanvasContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useSection } from '../context/SectionContext';
import { Layers, X, Check, ArrowRight } from 'lucide-react';
import html2canvas from 'html2canvas';

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
  const productParam = searchParams.get('product');
  const categoryParam = searchParams.get('category');

  const { addToCart } = useCart();
  const { user } = useAuth();
  const { canvasItems, setCanvasItems, addItemToCanvas } = useCanvas();
  const { settings, getBorderStyle } = useSiteSettings();
  const { setCurrentSection } = useSection();
  const canvasBuilderRef = useRef<CanvasBuilderRef>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<KeyringItem | null>(null);
  const [isMobileCanvasOpen, setIsMobileCanvasOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);

  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';
  const globalBorder = settings?.layout_border_color || 'rgba(255,255,255,0.3)';
  const borderStyle = getBorderStyle();
  const canvasBgColor = settings?.canvas_bg_color || '#FFFFFF';
  const accentColor = settings?.product_accent_color || '#34d399';

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { setCurrentSection('SHOP'); }, [setCurrentSection]);

  const fetchAllData = async () => {
    await Promise.all([fetchCategories(), fetchProducts()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (!data) return;
    setProducts(data.map(item => ({
      ...item,
      image: item.image_url || item.image || '',
      category_ids: item.category_ids || [item.category],
      product_type: item.product_type || null,
    })));
  };

  useEffect(() => {
    if (!categoryParam) { setSelectedCategory(null); return; }
    const cat = categories.find(c => c.slug.toLowerCase() === categoryParam.toLowerCase());
    if (cat) setSelectedCategory(cat.slug);
    else if (categories.length > 0) setSelectedCategory(null);
  }, [categoryParam, categories]);

  useEffect(() => {
    if (!productParam) {
      setSelectedProduct(null);
      return;
    }
    if (products.length === 0) return; // products 로드 대기
    const p = products.find(p => String(p.id) === productParam) ?? null;
    setSelectedProduct(p);
    if (p) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productParam, products]);

  const handleCategoryChange = (slug: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('category', slug);
      next.delete('product');
      return next;
    }, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (product: KeyringItem) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('product', product.id);
      return next;
    }, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeProductDetail = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('product');
      return next;
    }, { replace: false });
  };

  const handleAddToCart = (product: KeyringItem) => {
    addToCart({ id: product.id, name: product.name, price: product.sale_price || product.price, image: product.image, quantity: 1 });
    alert('장바구니에 추가되었습니다!');
  };

  const handleAddToCanvas = (product: KeyringItem) => {
    addItemToCanvas(product);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // SHOP 전용: 카트, BUILDER 전용: 캔버스, BOTH: 캔버스(카드에서 버튼 두개)
  const handleQuickAction = (product: KeyringItem) => {
    if (product.product_type === 'SHOP') handleAddToCart(product);
    else handleAddToCanvas(product);
  };

  const handleCanvasItemsChange = (items: CanvasItem[]) => setCanvasItems(items);

  const captureCanvasSnapshot = async (): Promise<string | null> => {
    const el = document.getElementById('canvas-drop-zone');
    if (!el) return null;
    try {
      if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(true);
      await new Promise(r => setTimeout(r, 100));
      const snap = await html2canvas(el, { useCORS: true, allowTaint: true, backgroundColor: canvasBgColor, scale: 0.5, logging: false });
      const url = snap.toDataURL('image/jpeg', 0.7);
      if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false);
      return url;
    } catch (e) { if (canvasBuilderRef.current) canvasBuilderRef.current.setCapturing(false); return null; }
  };

  const handleCanvasAddToCart = async () => {
    if (canvasItems.length === 0) return alert('Empty canvas!');
    const isMobile = window.innerWidth < 1024;
    if (isMobile && !isMobileCanvasOpen) { setIsMobileCanvasOpen(true); await new Promise(r => setTimeout(r, 300)); }
    const h = canvasBuilderRef.current?.getHeight() || 700;
    const url = await captureCanvasSnapshot();
    const total = canvasItems.reduce((s, i) => s + i.price, 0);
    addToCart({ id: 'custom-' + Date.now(), name: 'Custom Set', price: total, image: url || '', items: canvasItems, canvasHeight: h } as any);
    alert('Added!'); navigate('/cart'); setIsMobileCanvasOpen(false);
  };

  const handleSaveDesign = async () => {
    if (!user) { alert('Login needed'); navigate('/login'); return; }
    if (canvasItems.length === 0) return alert('Empty');
    const img = await captureCanvasSnapshot();
    const h = canvasBuilderRef.current?.getHeight() || 700;
    const design = { items: canvasItems.map(i => ({ id: i.id, name: i.name, category: i.category, price: i.price, image: i.image, canvasId: i.canvasId, x: i.x, y: i.y, rotation: i.rotation, real_width_cm: i.real_width_cm, object_px_width: i.object_px_width, image_width: i.image_width })), totalPrice: canvasItems.reduce((s, i) => s + i.price, 0), canvasHeight: h };
    const { error } = await supabase.from('saved_designs').insert({ user_id: user.id, design_name: `Design ${new Date().toLocaleDateString()}`, design_data: design, snapshot_image: img || '' });
    if (error) alert('Error'); else alert('Design Saved!');
  };

  const handleShareImage = async () => {
    if (canvasItems.length === 0) return alert('Empty');
    try {
      const url = await captureCanvasSnapshot();
      if (!url) throw new Error('Fail');
      const file = new File([dataURItoBlob(url)], 'design.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) await navigator.share({ title: 'My Design', files: [file] });
      else { const a = document.createElement('a'); a.href = url; a.download = `design-${Date.now()}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); alert('Downloaded!'); }
    } catch { alert('Share failed'); }
  };

  const filteredProducts = products.filter(p => {
    if (p.status === 'hidden') return false;
    if (!selectedCategory) return true;
    const catIds = p.category_ids || (p.category ? [p.category] : []);
    return catIds.includes(selectedCategory) && (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const renderCategorySections = (selectedIds: string[] | undefined) => {
    if (!selectedIds || selectedIds.length === 0) return null;
    const targetCats = Array.from(new Set(selectedIds))
      .map(id => categories.find(c => String(c.id) === String(id)))
      .filter((c): c is Category => !!c);
    return (
      <div className="space-y-12">
        {targetCats.map(category => {
          let prods = products.filter(p => {
            if (p.status === 'hidden') return false;
            const ids = p.category_ids || [p.category];
            let m = ids.includes(category.slug);
            if (!m && category.filter_type === 'MIX' && category.included_categories)
              m = category.included_categories.some(s => ids.includes(s.toLowerCase()));
            if (category.filter_type === 'ALL') m = true;
            return m;
          });
          if (prods.length === 0) return null;
          return (
            <div key={category.id}>
              <div className="flex justify-between items-end mb-4 border-b pb-2" style={{ borderColor: globalBorder }}>
                <h2 className="font-bold uppercase tracking-wider text-sm" style={{ color: globalText }}>{category.name}</h2>
                <button onClick={() => handleCategoryChange(category.slug)} className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1" style={{ color: globalText }}>VIEW ALL <ArrowRight size={12} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {prods.slice(0, 8).map(p => (
                  <ProductCard key={p.id} product={p} onClick={handleProductClick}
                    onAddToCanvas={handleQuickAction} onAddToCart={handleAddToCart}
                    customStyle={{ bg: settings?.product_card_bg, text: settings?.product_text_color, subText: settings?.product_sub_text_color, accent: accentColor, nameSize: settings?.product_name_size, catSize: settings?.product_category_size, priceSize: settings?.product_price_size }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center" style={{ backgroundColor: globalBg, color: globalText }}>LOADING...</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: globalBg, color: globalText }}>
      <div className="sticky top-0 z-50" style={{ backgroundColor: (settings as any)?.header_bg_color || 'transparent' }}>
        <Header
          cartCount={0}
          onSearchChange={setSearchQuery}
          onLogoClick={() => navigate('/')}
          categories={categories.filter(c => !c.is_hidden)}
          activeCategory={selectedCategory || ''}
          onCategoryChange={handleCategoryChange}
        />
      </div>
      {/* CategoryTabs 제거 — 카테고리는 헤더 로고 옆에 인라인으로 표시됨 */}

      <div className="w-full px-4 md:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] gap-6 items-start">

          {/* 좌: 상품 영역 */}
          <div className="min-w-0">
            {selectedProduct ? (
              <div className="py-4 md:py-0">
                <ProductDetailView product={selectedProduct} onBack={closeProductDetail} />
              </div>
            ) : selectedCategory ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} onClick={handleProductClick}
                    onAddToCanvas={handleQuickAction} onAddToCart={handleAddToCart}
                    customStyle={{ bg: settings?.product_card_bg, text: settings?.product_text_color, subText: settings?.product_sub_text_color, accent: accentColor, nameSize: settings?.product_name_size, catSize: settings?.product_category_size, priceSize: settings?.product_price_size }}
                  />
                ))}
              </div>
            ) : (
              <div>
                {settings?.builder_banner_images && settings.builder_banner_images.length > 0 && (
                  <div className="w-full mb-8">
                    <ShopBannerSlider
                      images={settings.builder_banner_images}
                      transition={settings.builder_banner_transition || 'slide'}
                      speed={settings.builder_banner_speed || 3000}
                    />
                  </div>
                )}
                {renderCategorySections(
                  (settings?.builder_home_categories && settings.builder_home_categories.length > 0)
                    ? settings.builder_home_categories
                    : settings?.shop_home_categories
                )}
              </div>
            )}
          </div>

          {/* 우: 드랍존 — 항상 우측에 고정 표시 */}
          <div className={`flex flex-col gap-4 ${isMobileCanvasOpen ? 'fixed inset-0 z-50 p-4 overflow-y-auto' : 'hidden lg:flex lg:sticky lg:top-[var(--header-offset,80px)]'}`}
            style={{ backgroundColor: isMobileCanvasOpen ? globalBg : 'transparent' }}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b lg:hidden" style={{ borderColor: globalBorder }}>
              <span className="font-bold text-lg" style={{ color: globalText }}>DROP ZONE</span>
              <button onClick={() => setIsMobileCanvasOpen(false)} style={{ color: globalText }}><X size={28} /></button>
            </div>
            <div className="border w-full max-w-[450px]" id="canvas-drop-zone" style={{ borderColor: globalBorder }}>
              <CanvasBuilder ref={canvasBuilderRef} onItemsChange={handleCanvasItemsChange} initialHeight={settings?.canvas_height || 650} />
            </div>
            <OrderSummary items={canvasItems.map(i => ({ id: i.canvasId, name: i.name, price: i.price }))}
              onAddToCart={handleCanvasAddToCart} onCheckout={handleCanvasAddToCart}
              onSaveDesign={handleSaveDesign} onShare={handleShareImage} />
          </div>
        </div>
      </div>

      {(settings?.footer_content || '').trim() && (
        <footer className="mt-20 border-t" style={{ borderColor: borderStyle.borderColor, backgroundColor: 'transparent' }}>
          <div className="px-4 md:px-6 py-12">
            <div className="max-w-6xl mx-auto text-xs md:text-sm leading-relaxed whitespace-pre-line opacity-80" style={{ color: globalText }}>
              {settings?.footer_content}
            </div>
          </div>
        </footer>
      )}

      <button onClick={() => setIsMobileCanvasOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: accentColor }}>
        <Layers className="text-black" size={24} />
      </button>

      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/90 text-white border border-white/20 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md">
            <Check size={16} style={{ color: accentColor }} />
            <span className="text-sm font-bold">드롭존에 추가되었습니다</span>
          </div>
        </div>
      )}

      <FloatingFooter />
    </div>
  );
};
