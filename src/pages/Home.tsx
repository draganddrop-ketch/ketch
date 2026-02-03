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
import { Wrench } from 'lucide-react';
import html2canvas from 'html2canvas';

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

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

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
    await Promise.all([
      fetchCategories(),
      fetchProducts(),
      fetchSettings()
    ]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_hidden', false)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) throw error;

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
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleProductClick = (product: KeyringItem) => {
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdd = (product: KeyringItem) => {
    addItemToCanvas(product);
  };

  const handleCanvasItemsChange = (items: CanvasItem[]) => {
    setCanvasItems(items);
  };

  const handleAddToCart = async () => {
    if (canvasItems.length === 0) {
      alert('Please add items to the canvas first!');
      return;
    }

    const canvasElement = document.getElementById('canvas-drop-zone');
    if (!canvasElement) {
      alert('Canvas not found!');
      return;
    }

    try {
      if (canvasBuilderRef.current) {
        canvasBuilderRef.current.setCapturing(true);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvasSnapshot = await html2canvas(canvasElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        scale: 2,
        logging: false,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: canvasElement.scrollWidth,
        windowHeight: canvasElement.scrollHeight,
      });

      const dataUrl = canvasSnapshot.toDataURL('image/png');

      if (canvasBuilderRef.current) {
        canvasBuilderRef.current.setCapturing(false);
      }

      const totalPrice = canvasItems.reduce((sum, item) => sum + item.price, 0);

      addToCart({
        id: 'custom-keyring-' + Date.now(),
        name: 'Custom Keyring Set',
        price: totalPrice,
        image: dataUrl,
        items: canvasItems,
      });

      alert('Items added to cart successfully!');
      navigate('/cart');
    } catch (error) {
      console.error('Failed to capture canvas:', error);
      if (canvasBuilderRef.current) {
        canvasBuilderRef.current.setCapturing(false);
      }
      alert('Failed to add items to cart. Please try again.');
    }
  };

  const handleCheckout = async () => {
    await handleAddToCart();
  };

  const captureCanvasSnapshot = async (): Promise<string | null> => {
    const canvasElement = document.getElementById('canvas-drop-zone');
    if (!canvasElement) {
      alert('Canvas not found!');
      return null;
    }

    try {
      if (canvasBuilderRef.current) {
        canvasBuilderRef.current.setCapturing(true);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvasSnapshot = await html2canvas(canvasElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        scale: 2,
        logging: false,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: canvasElement.scrollWidth,
        windowHeight: canvasElement.scrollHeight,
      });

      const dataUrl = canvasSnapshot.toDataURL('image/png');

      if (canvasBuilderRef.current) {
        canvasBuilderRef.current.setCapturing(false);
      }

      return dataUrl;
    } catch (error) {
      console.error('Failed to capture canvas:', error);
      if (canvasBuilderRef.current) {
        canvasBuilderRef.current.setCapturing(false);
      }
      return null;
    }
  };

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

    try {
      const snapshotImage = await captureCanvasSnapshot();
      if (!snapshotImage) {
        alert('Failed to capture canvas snapshot!');
        return;
      }

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
      };

      const { data, error } = await supabase
        .from('saved_designs')
        .insert({
          user_id: user.id,
          design_name: `Design ${new Date().toLocaleDateString()}`,
          design_data: designData,
          snapshot_image: snapshotImage,
        })
        .select();

      if (error) throw error;

      alert('Design saved successfully!');
    } catch (error: any) {
      console.error('Failed to save design:', error);
      alert(`Failed to save design: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleShare = async () => {
    if (canvasItems.length === 0) {
      alert('Please add items to the canvas first!');
      return;
    }

    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
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
      switch (activeCat.filter_type) {
        case 'ALL': matchesCategory = true; break;
        case 'MIX': 
          const categoryToCheckMix = product.menu_category || product.category;
          matchesCategory = activeCat.included_categories?.includes(categoryToCheckMix?.toUpperCase()) || false; 
          break;
        case 'SINGLE': default: 
          const productMenuCategory = product.menu_category || product.category;
          matchesCategory = productMenuCategory?.trim().toUpperCase() === activeCat.slug?.trim().toUpperCase(); 
          break;
      }
    }

    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sub_category || product.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const renderCategorySections = (selectedIds: string[] | undefined) => {
    if (!selectedIds || selectedIds.length === 0) return null;

    const targetCategories = categories.filter(c => {
      return selectedIds.some(savedId => String(savedId) === String(c.id));
    });

    if (targetCategories.length === 0) return null;

    return (
      <>
        {targetCategories.map(category => {
          const categoryProducts = products.filter(product => {
            if (product.status === 'hidden') return false;
            let matchesCategory = false;

            if (Array.isArray(product.category_ids) && product.category_ids.length > 0) {
              matchesCategory = product.category_ids.some(id => String(id) === String(category.id));
            }

            if (!matchesCategory) {
              const categoryToCheck = product.menu_category || product.category;
              switch (category.filter_type) {
                case 'ALL': matchesCategory = true; break;
                case 'MIX': matchesCategory = category.included_categories?.includes(categoryToCheck?.toUpperCase()) || false; break;
                case 'SINGLE': default: matchesCategory = categoryToCheck?.trim().toUpperCase() === category.slug?.trim().toUpperCase(); break;
              }
            }
            return matchesCategory;
          });

          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} className="mb-8">
              <h2 className="text-white font-bold uppercase tracking-wider mb-4 text-lg">
                {category.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={handleProductClick}
                    onAddToCanvas={handleQuickAdd}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-700 text-sm mb-2">LOADING...</div>
          <div className="text-zinc-800 text-xs">PLEASE WAIT</div>
        </div>
      </div>
    );
  }

  if (settings?.is_maintenance_mode) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-2" style={{ borderColor: settings.primary_color, backgroundColor: `${settings.primary_color}10` }}>
              <Wrench size={40} style={{ color: settings.primary_color }} />
            </div>
          </div>
          <h1 className="text-2xl text-white mb-4">MAINTENANCE MODE</h1>
          <p className="text-zinc-400 text-sm mb-6">We are upgrading. Come back soon.</p>
        </div>
      </div>
    );
  }

  const handleCategoryChange = (category: string) => {
    setSelectedProduct(null);
    if (currentSection === 'BUILDER') {
      if (category === 'all') {
        setViewMode('HOME');
        setSelectedCategory(null);
      } else {
        setViewMode('CATEGORY');
        setSelectedCategory(category);
      }
    } else {
      setSelectedCategory(category === 'all' ? null : category);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
      <Header cartCount={0} onSearchChange={setSearchQuery} onLogoClick={() => {
        setSelectedProduct(null);
        if (currentSection === 'SHOP') {
          setSelectedCategory(null);
        } else if (currentSection === 'BUILDER') {
          setViewMode('HOME');
          setSelectedCategory(null);
        }
      }} />

      <CategoryTabs
        activeCategory={selectedCategory || 'all'}
        onCategoryChange={handleCategoryChange}
      />

      <div className="max-w-[1300px] mx-auto px-6 py-4">
        {/* ★ 핵심 변경 사항: 
          BUILDER일 때는 2단 그리드 (65% : 35%), 
          SHOP일 때는 1단 그리드 (100%)로 자동 변경됩니다.
        */}
        <div className={`grid gap-6 ${currentSection === 'BUILDER' ? 'grid-cols-1 lg:grid-cols-[65%_35%]' : 'grid-cols-1'}`}>
          
          {/* 왼쪽 컬럼 (SHOP에서는 전체 너비) */}
          <div className="border border-white/30 p-6" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
            
            {/* 1. 상세페이지 보기 */}
            {selectedProduct ? (
              <ProductDetailView 
                product={selectedProduct} 
                onBack={() => setSelectedProduct(null)} 
              />
            ) : (
              /* 2. 상품 목록 보기 */
              <div className="space-y-4">
                {/* 배너 표시 로직 */}
                {currentSection === 'SHOP' ? (
                  // SHOP용 배너
                  !selectedCategory && settings?.shop_banner_images && settings.shop_banner_images.length > 0 && (
                    <div className="mb-3 w-full">
                      <ShopBannerSlider
                        images={settings.shop_banner_images}
                        transition={(settings.shop_banner_transition || settings.banner_transition || 'slide') as 'slide' | 'fade'}
                        speed={settings.shop_banner_speed || settings.banner_speed || 3000}
                      />
                    </div>
                  )
                ) : (
                  // BUILDER용 배너 (HOME 모드일 때만)
                  viewMode === 'HOME' && settings?.builder_banner_images && settings.builder_banner_images.length > 0 && (
                    <div className="mb-3 w-full">
                      <ShopBannerSlider
                        images={settings.builder_banner_images}
                        transition={(settings.builder_banner_transition || settings.banner_transition || 'slide') as 'slide' | 'fade'}
                        speed={settings.builder_banner_speed || settings.banner_speed || 3000}
                      />
                    </div>
                  )
                )}

                {/* 카테고리 섹션 or 전체 목록 표시 */}
                {currentSection === 'SHOP' ? (
                  // SHOP: 카테고리 설정에 따라 표시
                  !selectedCategory ? (
                    renderCategorySections(settings?.shop_home_categories)
                  ) : (
                    // 카테고리 필터링 됨
                    <>
                      <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">
                        PRODUCT LIST
                      </h2>
                      {filteredProducts.length === 0 ? (
                        <div className="text-white/40 text-center py-12">No products available</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onClick={handleProductClick}
                              onAddToCanvas={handleQuickAdd}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )
                ) : (
                  // BUILDER: 뷰모드에 따라 표시
                  viewMode === 'HOME' ? (
                    renderCategorySections(settings?.builder_home_categories)
                  ) : (
                    <>
                      <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">
                        PRODUCT LIST
                      </h2>
                      {filteredProducts.length === 0 ? (
                        <div className="text-white/40 text-center py-12">No products available</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onClick={handleProductClick}
                              onAddToCanvas={handleQuickAdd}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 (드롭존) - BUILDER일 때만 보임 */}
          {currentSection === 'BUILDER' && (
            <div className="space-y-4">
              <div className="border border-white/30" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
                <CanvasBuilder
                  ref={canvasBuilderRef}
                  onItemsChange={handleCanvasItemsChange}
                  initialHeight={settings?.canvas_height || 700}
                />
              </div>

              <OrderSummary
                items={canvasItems.map(item => ({
                  id: item.canvasId,
                  name: item.name,
                  price: item.price,
                }))}
                onAddToCart={handleAddToCart}
                onCheckout={handleCheckout}
                onSaveDesign={handleSaveDesign}
                onShare={handleShare}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};