import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CategoryTabs } from '../components/CategoryTabs';
import { ProductCard } from '../components/ProductCard';
import { CanvasBuilder, CanvasBuilderRef } from '../components/CanvasBuilder';
import { OrderSummary } from '../components/OrderSummary';
import { BannerSlider } from '../components/BannerSlider';
import { KeyringItem } from '../types';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
}

interface MainPageSection {
  id: string;
  type: 'BANNER' | 'PRODUCT_LIST';
  title: string;
  image_url: string | null;
  image_urls: string[];
  filter_type: 'NEW' | 'BEST' | 'ALL' | null;
  target_category_slug: string | null;
  order_index: number;
  show_title?: boolean;
  title_position?: 'center' | 'bottom-left' | 'bottom-right';
  dark_overlay?: boolean;
}

export const Home = () => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const canvasBuilderRef = useRef<CanvasBuilderRef>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [mainPageSections, setMainPageSections] = useState<MainPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchMainPageSections();
  }, []);

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
        image: item.image_url,
        description: item.description,
        gallery_images: item.gallery_images,
        is_best: item.is_best,
        is_new: item.is_new,
      }));

      console.log('Home loaded products:', formattedProducts);
      console.log('Product categories:', formattedProducts.map(p => ({
        name: p.name,
        category: p.category
      })));

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMainPageSections = async () => {
    try {
      const { data, error } = await supabase
        .from('main_page_sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      setMainPageSections(data || []);
    } catch (err) {
      console.error('Failed to fetch main page sections:', err);
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
      console.log('Starting canvas capture...');

      if (canvasBuilderRef.current) {
        canvasBuilderRef.current.setCapturing(true);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Capturing canvas with html2canvas...');
      const canvasSnapshot = await html2canvas(canvasElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        scale: 2,
        logging: true,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: canvasElement.scrollWidth,
        windowHeight: canvasElement.scrollHeight,
      });

      console.log('Canvas captured successfully:', canvasSnapshot.width, 'x', canvasSnapshot.height);

      const dataUrl = canvasSnapshot.toDataURL('image/png');
      console.log('DataURL generated, length:', dataUrl.length);

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

      console.log('Saving design with user_id:', user.id);
      console.log('Design data:', designData);

      const { data, error } = await supabase
        .from('saved_designs')
        .insert({
          user_id: user.id,
          design_name: `Design ${new Date().toLocaleDateString()}`,
          design_data: designData,
          snapshot_image: snapshotImage,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Design saved successfully:', data);
      alert('Design saved successfully!');
    } catch (error: any) {
      console.error('Failed to save design:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
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
    const activeCat = categories.find(c => c.slug === activeCategory);

    if (!activeCat) return true;

    let matchesCategory = false;

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

    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sub_category || product.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  console.log('Filtering products:', {
    activeCategory,
    totalProducts: products.length,
    filteredCount: filteredProducts.length,
    filteredProducts: filteredProducts.map(p => ({ name: p.name, category: p.category }))
  });

  if (loading || settingsLoading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-700 text-sm mb-2">LOADING_PRODUCTS...</div>
          <div className="text-zinc-800 text-xs">ESTABLISHING_CONNECTION</div>
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
          <h1 className="text-2xl text-white mb-4">MAINTENANCE_MODE</h1>
          <p className="text-zinc-400 text-sm mb-6">
            We are upgrading our gear. Come back soon.
          </p>
          <div className="text-zinc-600 text-xs">
            System will be back online shortly...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
      <Header cartCount={0} onSearchChange={setSearchQuery} onLogoClick={() => setActiveCategory('all')} />
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="max-w-[1300px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
          <div className="border border-white/30 p-6" style={{ backgroundColor: settings?.bg_color || '#000000' }}>
            {activeCategory === 'all' ? (
              <div className="space-y-8">
                {mainPageSections.length === 0 ? (
                  <div className="text-white/40 text-center py-12">
                    No sections configured. Visit the Admin Panel to set up your main page.
                  </div>
                ) : (
                  mainPageSections.map((section) => (
                    <div key={section.id}>
                      {section.type === 'BANNER' && (
                        <BannerSlider
                          images={section.image_urls && section.image_urls.length > 0 ? section.image_urls : section.image_url ? [section.image_url] : []}
                          title={section.title}
                          showTitle={section.show_title ?? true}
                          titlePosition={section.title_position || 'center'}
                          darkOverlay={section.dark_overlay ?? true}
                        />
                      )}

                      {section.type === 'PRODUCT_LIST' && (
                        <div>
                          <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-lg">
                            {section.title}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products
                              .filter((product) => {
                                if (section.target_category_slug) {
                                  return product.category?.trim().toUpperCase() === section.target_category_slug.toUpperCase();
                                }

                                if (!section.filter_type || section.filter_type === 'ALL') return true;
                                if (section.filter_type === 'BEST') return product.is_best;
                                if (section.filter_type === 'NEW') return product.is_new;
                                return true;
                              })
                              .map((product) => (
                                <ProductCard
                                  key={product.id}
                                  product={product}
                                  onAddToCanvas={handleProductClick}
                                />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
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
    </div>
  );
};
