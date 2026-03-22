import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { KeyringItem } from '../types';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useSection } from '../context/SectionContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  filter_type: 'SINGLE' | 'ALL' | 'MIX';
  included_categories?: string[];
  section: 'SHOP' | 'BUILDER';
}

export const LandingPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { setCurrentSection } = useSection();
  const { settings } = useSiteSettings();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('*')
          .neq('status', 'hidden')
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('is_hidden', false).order('display_order', { ascending: true }),
      ]);
      if (prods) {
        setProducts(prods.map(item => ({
          ...item,
          id: item.id,
          image: item.image_url || item.image || '',
          category_ids: item.category_ids || [item.category],
        })) as KeyringItem[]);
      }
      if (cats) setCategories(cats);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleQuickAdd = (product: KeyringItem) => {
    addToCart({ id: product.id, name: product.name, price: product.sale_price || product.price, image: product.image, quantity: 1 });
    alert('Added to Cart!');
  };

  const handleProductClick = (product: KeyringItem) => {
    setCurrentSection('SHOP');
    navigate(`/?section=shop&product=${product.id}`);
  };

  const getProductsByCategoryId = (catId: string) => {
    const category = categories.find(c => String(c.id) === String(catId));
    if (!category) return [];
    return products.filter(p => (p.category_ids || [p.category]).includes(category.slug));
  };

  // 카테고리 섹션 렌더링 (shop_home_categories 재사용)
  const renderCategorySections = (selectedIds: string[] | undefined) => {
    if (!selectedIds || selectedIds.length === 0) return null;
    const uniqueIds = Array.from(new Set(selectedIds));
    const targetCategories = uniqueIds
      .map(id => categories.find(c => String(c.id) === String(id)))
      .filter((c): c is Category => !!c);
    if (targetCategories.length === 0) return null;

    return (
      <div className="space-y-12">
        {targetCategories.map(category => {
          let categoryProducts = getProductsByCategoryId(String(category.id));
          if (category.filter_type === 'ALL') categoryProducts = products;
          else if (category.filter_type === 'MIX' && category.included_categories) {
            categoryProducts = products.filter(p => {
              const productCatIds = p.category_ids || [p.category];
              return category.included_categories!.some(slug => productCatIds.includes(slug.toLowerCase()));
            });
          }
          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: globalText }}>{category.name}</h3>
                <button
                  onClick={() => { setCurrentSection('SHOP'); navigate(`/?section=shop&category=${category.slug}`); }}
                  className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                  style={{ color: globalText }}
                >
                  VIEW ALL →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryProducts.slice(0, 8).map(p => (
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
                      priceSize: settings?.product_price_size,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 메인 배너 슬롯 3개 렌더링 (main_slot* 또는 shop_slot* 폴백)
  const renderMainLayout = () => {
    const slot1 = (settings as any)?.main_slot1_images?.length
      ? (settings as any).main_slot1_images
      : settings?.shop_slot1_images?.length
      ? settings.shop_slot1_images
      : ['https://via.placeholder.com/550x700/222/fff?text=Slot+1'];
    const slot2 = (settings as any)?.main_slot2_images?.length
      ? (settings as any).main_slot2_images
      : settings?.shop_slot2_images?.length
      ? settings.shop_slot2_images
      : ['https://via.placeholder.com/550x700/333/fff?text=Slot+2'];
    const slot3 = (settings as any)?.main_slot3_images?.length
      ? (settings as any).main_slot3_images
      : settings?.shop_slot3_images?.length
      ? settings.shop_slot3_images
      : ['https://via.placeholder.com/550x700/444/fff?text=Slot+3'];

    const transition = (settings as any)?.main_banner_transition || settings?.banner_transition || 'slide';
    const speed = (settings as any)?.main_banner_speed || settings?.banner_speed || 3000;
    const mainCategories = (settings as any)?.main_home_categories || settings?.shop_home_categories;

    const commonSwiperProps = {
      modules: [Autoplay, EffectFade, Pagination],
      effect: transition === 'fade' ? 'fade' : 'slide',
      autoplay: { delay: speed, disableOnInteraction: false },
      pagination: { clickable: true, dynamicBullets: true },
      loop: true,
      className: 'w-full h-full',
    };

    return (
      <div className="w-full pt-4 px-4 md:px-6">
        {/* 3-Column Banners */}
        <div className="w-full mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full h-auto overflow-hidden rounded-sm">
              <Swiper {...commonSwiperProps}>
                {slot1.map((src: string, idx: number) => (
                  <SwiperSlide key={`m1-${idx}`}>
                    <img src={src} className="w-full h-auto object-contain" alt="Main Slot 1" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="w-full h-auto overflow-hidden rounded-sm">
              <Swiper {...commonSwiperProps}>
                {slot2.map((src: string, idx: number) => (
                  <SwiperSlide key={`m2-${idx}`}>
                    <img src={src} className="w-full h-auto object-contain" alt="Main Slot 2" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="w-full h-auto overflow-hidden rounded-sm">
              <Swiper {...commonSwiperProps}>
                {slot3.map((src: string, idx: number) => (
                  <SwiperSlide key={`m3-${idx}`}>
                    <img src={src} className="w-full h-auto object-contain" alt="Main Slot 3" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>

        {/* 카테고리 섹션 */}
        <div className="w-full mt-12 pb-20">
          {renderCategorySections(mainCategories)}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: globalBg, color: globalText }}>
      LOADING...
    </div>
  );

  if (settings?.is_maintenance_mode) return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: globalBg, color: globalText }}>
      <div className="text-center"><h1 className="text-2xl">MAINTENANCE</h1></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: globalBg, color: globalText }}>
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md">
        <Header
          cartCount={0}
          onLogoClick={() => navigate('/')}
        />
      </div>
      {renderMainLayout()}
    </div>
  );
};
