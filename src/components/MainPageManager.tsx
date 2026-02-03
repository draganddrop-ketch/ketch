import { useState, useEffect } from 'react';
import { Upload, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ConfigTab = 'BUILDER' | 'SHOP' | 'GLOBAL';

interface Category {
  id: string;
  name: string;
  slug: string;
  section: 'SHOP' | 'BUILDER';
}

export const MainPageManager = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('BUILDER');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  const [builderSelected, setBuilderSelected] = useState<string[]>([]);
  const [shopSelected, setShopSelected] = useState<string[]>([]);

  const [builderBannerImages, setBuilderBannerImages] = useState<string[]>([]);
  const [shopBannerImages, setShopBannerImages] = useState<string[]>([]);

  const [builderBannerTransition, setBuilderBannerTransition] = useState('slide');
  const [builderBannerSpeed, setBuilderBannerSpeed] = useState(3000);
  const [shopBannerTransition, setShopBannerTransition] = useState('slide');
  const [shopBannerSpeed, setShopBannerSpeed] = useState(3000);
  const [bannerTransition, setBannerTransition] = useState('slide');
  const [bannerSpeed, setBannerSpeed] = useState(3000);

  const [builderBannerFiles, setBuilderBannerFiles] = useState<File[]>([]);
  const [builderBannerPreviewUrls, setBuilderBannerPreviewUrls] = useState<string[]>([]);
  const [shopBannerFiles, setShopBannerFiles] = useState<File[]>([]);
  const [shopBannerPreviewUrls, setShopBannerPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    return () => {
      builderBannerPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      shopBannerPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const fetchInitialData = async () => {
    await fetchCategories();
    await fetchSettings();
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, section')
        .eq('is_hidden', false)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.log('No settings found, creating defaults...');
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert({
            id: 1,
            site_name: 'My Store',
            bg_color: '#000000',
            builder_home_categories: [],
            shop_home_categories: [],
            builder_banner_images: [],
            shop_banner_images: []
          });

        if (insertError) {
          console.error('Error creating default settings:', insertError);
        } else {
          setBuilderSelected([]);
          setShopSelected([]);
          setBuilderBannerImages([]);
          setShopBannerImages([]);
        }
        return;
      }

      console.log('📥 DB Data:', data);
      console.log('  → builder_home_categories:', data.builder_home_categories);
      console.log('  → shop_home_categories:', data.shop_home_categories);

      const builderIds = Array.isArray(data.builder_home_categories)
        ? data.builder_home_categories.map(id => String(id))
        : [];
      const shopIds = Array.isArray(data.shop_home_categories)
        ? data.shop_home_categories.map(id => String(id))
        : [];

      setBuilderSelected(builderIds);
      setShopSelected(shopIds);
      setBuilderBannerImages(Array.isArray(data.builder_banner_images) ? data.builder_banner_images : []);
      setShopBannerImages(Array.isArray(data.shop_banner_images) ? data.shop_banner_images : []);
      setBuilderBannerTransition(data.builder_banner_transition || 'slide');
      setBuilderBannerSpeed(data.builder_banner_speed || 3000);
      setShopBannerTransition(data.shop_banner_transition || 'slide');
      setShopBannerSpeed(data.shop_banner_speed || 3000);
      setBannerTransition(data.banner_transition || 'slide');
      setBannerSpeed(data.banner_speed || 3000);

      console.log('✅ Local State Set (converted to strings):');
      console.log('  → builderSelected:', builderIds);
      console.log('  → shopSelected:', shopIds);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `public/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const handleBuilderBannerFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setBuilderBannerFiles(filesArray);

      builderBannerPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      const previewUrls = filesArray.map(file => URL.createObjectURL(file));
      setBuilderBannerPreviewUrls(previewUrls);
    }
  };

  const removeBuilderBannerPreview = (index: number) => {
    setBuilderBannerFiles(prev => prev.filter((_, i) => i !== index));
    setBuilderBannerPreviewUrls(prev => {
      if (prev[index].startsWith('blob:')) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingBuilderBanner = (index: number) => {
    setBuilderBannerImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleShopBannerFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setShopBannerFiles(filesArray);

      shopBannerPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      const previewUrls = filesArray.map(file => URL.createObjectURL(file));
      setShopBannerPreviewUrls(previewUrls);
    }
  };

  const removeShopBannerPreview = (index: number) => {
    setShopBannerFiles(prev => prev.filter((_, i) => i !== index));
    setShopBannerPreviewUrls(prev => {
      if (prev[index].startsWith('blob:')) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingShopBanner = (index: number) => {
    setShopBannerImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleBuilderCategory = (categoryId: string) => {
    setBuilderSelected(prev => {
      const categoryIdStr = String(categoryId);
      const newValue = prev.includes(categoryIdStr)
        ? prev.filter(id => id !== categoryIdStr)
        : [...prev, categoryIdStr];
      console.log('🔄 Builder toggle:', categoryIdStr, '→', newValue);
      return newValue;
    });
  };

  const toggleShopCategory = (categoryId: string) => {
    setShopSelected(prev => {
      const categoryIdStr = String(categoryId);
      const newValue = prev.includes(categoryIdStr)
        ? prev.filter(id => id !== categoryIdStr)
        : [...prev, categoryIdStr];
      console.log('🔄 Shop toggle:', categoryIdStr, '→', newValue);
      return newValue;
    });
  };

  const handleSaveBuilderConfig = async () => {
    try {
      setUploading(true);
      setMessage('');

      console.log('💾 Saving Builder Config...');
      console.log('  → builderSelected:', builderSelected);

      let updatedBuilderBannerImages = [...builderBannerImages];

      if (builderBannerFiles.length > 0) {
        for (const file of builderBannerFiles) {
          const url = await uploadImage(file);
          if (url) {
            updatedBuilderBannerImages.push(url);
          }
        }
      }

      const builderCategoriesAsStrings = builderSelected.map(id => String(id));

      const { error } = await supabase
        .from('site_settings')
        .update({
          builder_banner_images: updatedBuilderBannerImages,
          builder_home_categories: builderCategoriesAsStrings,
          builder_banner_transition: builderBannerTransition,
          builder_banner_speed: builderBannerSpeed
        })
        .eq('id', 1);

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }

      console.log('✅ Saved successfully!');

      setBuilderBannerImages(updatedBuilderBannerImages);
      setBuilderBannerFiles([]);
      builderBannerPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setBuilderBannerPreviewUrls([]);

      const fileInput = document.getElementById('builder-banner-files-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setMessage('✅ Builder configuration saved successfully!');

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error saving builder config:', error);
      setMessage('❌ Failed to save builder configuration');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveShopConfig = async () => {
    try {
      setUploading(true);
      setMessage('');

      console.log('💾 Saving Shop Config...');
      console.log('  → shopSelected:', shopSelected);

      let updatedBannerImages = [...shopBannerImages];

      if (shopBannerFiles.length > 0) {
        for (const file of shopBannerFiles) {
          const url = await uploadImage(file);
          if (url) {
            updatedBannerImages.push(url);
          }
        }
      }

      const shopCategoriesAsStrings = shopSelected.map(id => String(id));

      const { error } = await supabase
        .from('site_settings')
        .update({
          shop_banner_images: updatedBannerImages,
          shop_home_categories: shopCategoriesAsStrings,
          shop_banner_transition: shopBannerTransition,
          shop_banner_speed: shopBannerSpeed
        })
        .eq('id', 1);

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }

      console.log('✅ Saved successfully!');

      setShopBannerImages(updatedBannerImages);
      setShopBannerFiles([]);
      shopBannerPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setShopBannerPreviewUrls([]);

      const fileInput = document.getElementById('shop-banner-files-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setMessage('✅ Shop configuration saved successfully!');

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error saving shop config:', error);
      setMessage('❌ Failed to save shop configuration');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGlobalOptions = async () => {
    try {
      setUploading(true);
      setMessage('');

      const { error } = await supabase
        .from('site_settings')
        .update({
          banner_transition: bannerTransition,
          banner_speed: bannerSpeed
        })
        .eq('id', 1);

      if (error) throw error;

      setMessage('✅ Global options saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving global options:', error);
      setMessage('❌ Failed to save global options');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Main Page Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure banner images and displayed categories for BUILDER and SHOP modes
        </p>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.includes('❌')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('BUILDER')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'BUILDER'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            BUILDER CONFIG
          </button>
          <button
            onClick={() => setActiveTab('SHOP')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'SHOP'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            SHOP CONFIG
          </button>
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'GLOBAL'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            GLOBAL OPTIONS
          </button>
        </div>
      </div>

      {activeTab === 'BUILDER' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Builder Mode Settings</h4>
          <p className="text-sm text-gray-600 mb-6">
            Configure the banner and categories shown in BUILDER mode
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Images
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload images for the builder page banner slider
              </p>

              {builderBannerImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Current Images ({builderBannerImages.length})</p>
                  <div className="grid grid-cols-3 gap-3">
                    {builderBannerImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingBuilderBanner(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBuilderBannerFilesChange}
                className="hidden"
                id="builder-banner-files-input"
              />
              <label
                htmlFor="builder-banner-files-input"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Upload size={18} />
                Upload Banner Images
              </label>

              {builderBannerPreviewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">New Images ({builderBannerPreviewUrls.length})</p>
                  <div className="grid grid-cols-3 gap-3">
                    {builderBannerPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-blue-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeBuilderBannerPreview(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Displayed Categories
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select which categories to display on the builder home page
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {categories.filter(cat => cat.section === 'BUILDER').length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No BUILDER categories available</p>
                ) : (
                  categories
                    .filter(cat => cat.section === 'BUILDER')
                    .map(category => (
                      <label key={category.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={builderSelected.some(id => String(id) === String(category.id))}
                          onChange={() => toggleBuilderCategory(category.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Transition Effect
                </label>
                <select
                  value={builderBannerTransition}
                  onChange={(e) => setBuilderBannerTransition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="slide">Slide</option>
                  <option value="fade">Fade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autoplay Speed (milliseconds)
                </label>
                <input
                  type="number"
                  value={builderBannerSpeed}
                  onChange={(e) => setBuilderBannerSpeed(parseInt(e.target.value) || 3000)}
                  min="1000"
                  max="10000"
                  step="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBuilderConfig}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {uploading ? 'Saving...' : 'Save Builder Config'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'SHOP' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Shop Mode Settings</h4>
          <p className="text-sm text-gray-600 mb-6">
            Configure the banner and categories shown in SHOP mode
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Images
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload images for the shop page banner slider
              </p>

              {shopBannerImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Current Images ({shopBannerImages.length})</p>
                  <div className="grid grid-cols-3 gap-3">
                    {shopBannerImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingShopBanner(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleShopBannerFilesChange}
                className="hidden"
                id="shop-banner-files-input"
              />
              <label
                htmlFor="shop-banner-files-input"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-orange-600 text-white rounded-lg cursor-pointer hover:bg-orange-700 transition-colors"
              >
                <Upload size={18} />
                Upload Banner Images
              </label>

              {shopBannerPreviewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">New Images ({shopBannerPreviewUrls.length})</p>
                  <div className="grid grid-cols-3 gap-3">
                    {shopBannerPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-orange-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeShopBannerPreview(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Displayed Categories
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select which categories to display on the shop home page
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {categories.filter(cat => cat.section === 'SHOP').length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No SHOP categories available</p>
                ) : (
                  categories
                    .filter(cat => cat.section === 'SHOP')
                    .map(category => (
                      <label key={category.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopSelected.some(id => String(id) === String(category.id))}
                          onChange={() => toggleShopCategory(category.id)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Transition Effect
                </label>
                <select
                  value={shopBannerTransition}
                  onChange={(e) => setShopBannerTransition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value="slide">Slide</option>
                  <option value="fade">Fade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autoplay Speed (milliseconds)
                </label>
                <input
                  type="number"
                  value={shopBannerSpeed}
                  onChange={(e) => setShopBannerSpeed(parseInt(e.target.value) || 3000)}
                  min="1000"
                  max="10000"
                  step="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveShopConfig}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {uploading ? 'Saving...' : 'Save Shop Config'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'GLOBAL' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Global Banner Options</h4>
          <p className="text-sm text-gray-600 mb-6">
            These settings apply to all banner sliders
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Transition Effect
              </label>
              <select
                value={bannerTransition}
                onChange={(e) => setBannerTransition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Speed (milliseconds)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How long each image displays (e.g., 3000 = 3 seconds)
              </p>
              <input
                type="number"
                value={bannerSpeed}
                onChange={(e) => setBannerSpeed(parseInt(e.target.value) || 3000)}
                min="1000"
                max="10000"
                step="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <button
              onClick={handleSaveGlobalOptions}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {uploading ? 'Saving...' : 'Save Global Options'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
