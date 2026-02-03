import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryTabs } from '../components/CategoryTabs';
import { ProductCard } from '../components/ProductCard';
import { CanvasBuilder, CanvasBuilderRef } from '../components/CanvasBuilder';
import { OrderSummary } from '../components/OrderSummary';
import { ShopBannerSlider } from '../components/ShopBannerSlider';
import { KeyringItem } from '../types';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSection } from '../context/SectionContext';
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
}

export const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { currentSection } = useSection();
  const canvasBuilderRef = useRef<CanvasBuilderRef>(null);
  const [viewMode, setViewMode] = useState<'HOME' | 'CATEGORY'>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
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

      console.log('🏠 Home Settings Loaded:', data);
      console.log('  → shop_home_categories:', data?.shop_home_categories);
      console.log('  → builder_home_categories:', data?.builder_home_categories);

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

      console.log('📁 Categories Loaded:', data?.length);
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
        description: item.description,
        gallery_images: item.gallery_images,
        is_best: item.is_best,
        is_new: item.is_new,
      }));

      console.log('📦 Products Loaded:', formattedProducts.length);
      setProducts(formattedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleProductClick = (product: KeyringItem) => {
    if ((window as any).__addItemToCanvas) {
      (window as any).__addItemToCanvas(product);
    }
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
    if (product.status === 'hidden') {
      return false;
    }

    if (!selectedCategory) return true;

    const activeCat = categories.find(c => c.slug === selectedCategory);
    if (!activeCat) return true;

    let matchesCategory = false;

    // Check if product belongs to this category via category_ids array
    if (Array.isArray(product.category_ids) && product.category_ids.length > 0) {
      matchesCategory = product.category_ids.some(id => String(id) === String(activeCat.id));
    }

    // Fallback to legacy filtering if category_ids not set
    if (!matchesCategory) {
      switch (activeCat.filter_type) {
        case 'ALL':
          matchesCategory = true;
          break;
        case 'MIX':
          const categoryToCheck = product.menu_category || product.category;
          matchesCategory = activeCat.included_categories?.includes(categoryToCheck?.toUpperCase()) || false;
          break;
        case 'SINGLE':
        default:
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
    console.log('🎨 renderCategorySections called:', {
      selectedIds,
      selectedIdsLength: selectedIds?.length,
      categoriesCount: categories.length,
      productsCount: products.length
    });

    if (!selectedIds || selectedIds.length === 0) {
      console.log('⚠️ No category IDs provided - returning null');
      return null;
    }

    const targetCategories = categories.filter(c => {
      const isMatch = selectedIds.some(savedId => String(savedId) === String(c.id));
      console.log(`  → Checking category ${c.name} (${c.id}):`, isMatch ? '✅ MATCH' : '❌ no match');
      return isMatch;
    });
    console.log(`✅ Found ${targetCategories.length} matching categories:`, targetCategories.map(c => c.name));

    if (targetCategories.length === 0) {
      console.log('❌ No matching categories found');
      return null;
    }

    return (
      <>
        {targetCategories.map(category => {
          console.log(`📋 Processing category: ${category.name} (${category.filter_type})`);

          const categoryProducts = products.filter(product => {
            if (product.status === 'hidden') return false;

            let matchesCategory = false;
            const categoryToCheck = product.menu_category || product.category;

            switch (category.filter_type) {
              case 'ALL':
                matchesCategory = true;
                break;
              case 'MIX':
                matchesCategory = category.included_categories?.includes(categoryToCheck?.toUpperCase()) || false;
                break;
              case 'SINGLE':
              default:
                matchesCategory = categoryToCheck?.trim().toUpperCase() === category.slug?.trim().toUpperCase();
                break;
            }

            return matchesCategory;
          });

          console.log(`  → ${category.name} has ${categoryProducts.length} products`);

          if (categoryProducts.length === 0) {
            console.log(`  → Skipping ${category.name} (no products)`);
            return null;
          }

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
                    onAddToCanvas={handleProductClick}
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
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center border-2"
              style={{
                borderColor: settings.primary_color,
                backgroundColor: `${settings.primary_color}10`,
              }}
            >
              <Wrench size={40} style={{ color: settings.primary_color }} />
            </div>
          </div>
          <h1 className="text-2xl text-white mb-4">MAINTENANCE MODE</h1>
          <p className="text-zinc-400 text-sm mb-6">
            We are upgrading. Come back soon.
          </p>
          <div className="text-zinc-600 text-xs">
            System will be back online shortly...
          </div>
        </div>
      </div>
    );
  }

  const handleCategoryChange = (category: string) => {
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

      {currentSection === 'SHOP' && <div className="border-b border-white/20" />}

      {currentSection === 'SHOP' ? (
        <div className="w-full">
          {!selectedCategory ? (
            <>
              {settings?.shop_banner_images && settings.shop_banner_images.length > 0 && (
                <div className="w-full mb-8">
                  <div className="max-w-[1300px] mx-auto px-6">
                    <ShopBannerSlider
                      images={settings.shop_banner_images}
                      transition={(settings.shop_banner_transition || settings.banner_transition || 'slide') as 'slide' | 'fade'}
                      speed={settings.shop_banner_speed || settings.banner_speed || 3000}
                    />
                  </div>
                </div>
              )}

              <div className="max-w-[1300px] mx-auto px-6 pb-8">
                {renderCategorySections(settings?.shop_home_categories)}
              </div>
            </>
          ) : (
            <div className="max-w-[1300px] mx-auto px-6 py-8">
              <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">
                PRODUCT LIST
              </h2>
              {loading ? (
                <div className="text-white/40 text-center py-12">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-white/40 text-center py-12">No products available</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCanvas={handleProductClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-[1300px] mx-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
            <div className="border border-white/30 p-6" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
              {viewMode === 'HOME' ? (
                <div className="space-y-4">
                  {settings?.builder_banner_images && settings.builder_banner_images.length > 0 && (
                    <div className="mb-3 w-full">
                      <ShopBannerSlider
                        images={settings.builder_banner_images}
                        transition={(settings.builder_banner_transition || settings.banner_transition || 'slide') as 'slide' | 'fade'}
                        speed={settings.builder_banner_speed || settings.banner_speed || 3000}
                      />
                    </div>
                  )}

                  {renderCategorySections(settings?.builder_home_categories)}
                </div>
              ) : (
                <>
                  <h2 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">
                    PRODUCT LIST
                  </h2>
                  {loading ? (
                    <div className="text-white/40 text-center py-12">Loading products...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-white/40 text-center py-12">No products available</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCanvas={handleProductClick}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
};
