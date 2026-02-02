import { useState, useEffect } from 'react';
import { Trash2, Upload, LogOut, LayoutDashboard, Package, Settings, Edit2, Plus, X, Users, ChevronUp, ChevronDown, Save, Home, Eye, EyeOff, FolderInput, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { KeyringItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { SiteSettingsForm } from '../components/SiteSettingsForm';
import { MainPageManager } from '../components/MainPageManager';
import { ProductInventory } from './ProductInventory';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  filter_type: 'SINGLE' | 'ALL' | 'MIX';
  included_categories?: string[];
  is_hidden: boolean;
}

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

type TabType = 'dashboard' | 'products' | 'inventory' | 'mainpage' | 'settings' | 'users';

export const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const primaryColor = settings?.primary_color || '#34d399';
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryData, setEditCategoryData] = useState({
    name: '',
    filter_type: 'SINGLE' as 'SINGLE' | 'ALL' | 'MIX',
    included_categories: [] as string[],
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    is_best: false,
    is_new: false,
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [movingProductId, setMovingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    return () => {
      if (mainImagePreviewUrl) URL.revokeObjectURL(mainImagePreviewUrl);
      galleryPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [mainImagePreviewUrl, galleryPreviewUrls]);

  useEffect(() => {
    if (user) {
      console.log('=== SUPABASE CONFIGURATION ===');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
      console.log('Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      console.log('Anon Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
      console.log('=== SUPABASE CLIENT OBJECT ===');
      console.log('Supabase client:', supabase);
      console.log('Supabase storage:', supabase.storage);
      fetchCategories();
      fetchProducts();
      fetchProfiles();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) console.error('Category Fetch Error:', error);
    else setCategories(data || []);
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts: KeyringItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        image: item.image_url,
      }));

      console.log('Fetched products:', formattedProducts);
      console.log('Product categories:', formattedProducts.map(p => ({ name: p.name, category: p.category })));

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setMessage('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setMainImageFile(file);

      if (mainImagePreviewUrl) {
        URL.revokeObjectURL(mainImagePreviewUrl);
      }
      setMainImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setGalleryFiles(filesArray);

      galleryPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      const previewUrls = filesArray.map(file => URL.createObjectURL(file));
      setGalleryPreviewUrls(previewUrls);
    }
  };

  const removeMainImage = () => {
    setMainImageFile(null);
    if (mainImagePreviewUrl) {
      URL.revokeObjectURL(mainImagePreviewUrl);
      setMainImagePreviewUrl('');
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('=== STARTING IMAGE UPLOAD ===');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `public/${Date.now()}.${fileExt}`;

      console.log('Generated filename:', fileName);
      console.log('Target bucket: product-images');
      console.log('Full upload path:', `product-images/${fileName}`);
      console.log('Supabase storage client:', supabase.storage);

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) {
        console.error('=== UPLOAD ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error status:', (error as any).statusCode);
        console.error('Full error object:', error);
        console.error('Error name:', (error as any).name);
        throw error;
      }

      console.log('=== UPLOAD SUCCESSFUL ===');
      console.log('Upload data:', data);
      console.log('Upload path:', data?.path);

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('=== PUBLIC URL GENERATED ===');
      console.log('Public URL:', publicUrlData.publicUrl);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('=== IMAGE UPLOAD FAILED ===');
      console.error('Error object:', err);
      console.error('Error type:', typeof err);
      if (err && typeof err === 'object' && 'message' in err) {
        console.error('Error message:', (err as any).message);
        console.error('Error statusCode:', (err as any).statusCode);
      }
      return null;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      setMessage('Please fill all required fields');
      return;
    }

    try {
      setUploading(true);
      setMessage('');

      let mainImageUrl: string | null = null;
      if (mainImageFile) {
        console.log('=== Starting main image upload ===');
        mainImageUrl = await uploadImage(mainImageFile);
        if (!mainImageUrl) {
          setMessage('Main image upload failed - Check console for details');
          return;
        }
        console.log('Main image uploaded successfully:', mainImageUrl);
      }

      let galleryImageUrls: string[] = [];
      if (galleryFiles.length > 0) {
        console.log('=== Starting upload of gallery images ===');
        for (const file of galleryFiles) {
          const url = await uploadImage(file);
          if (url) {
            galleryImageUrls.push(url);
          }
        }
        console.log('Gallery images uploaded successfully:', galleryImageUrls);
      }

      console.log('Inserting product to database:', {
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price),
        description: formData.description,
        image_url: mainImageUrl,
        gallery_images: galleryImageUrls,
      });

      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          category: formData.category,
          price: parseInt(formData.price),
          description: formData.description,
          image_url: mainImageUrl,
          gallery_images: galleryImageUrls,
          is_best: formData.is_best,
          is_new: formData.is_new,
        });

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Product added successfully!');
      setMessage('Product added successfully!');

      const firstCategory = categories.length > 0 ? categories[0].slug : '';
      setFormData({ name: '', category: firstCategory, price: '', description: '', is_best: false, is_new: false });
      setMainImageFile(null);
      setMainImagePreviewUrl('');
      setGalleryFiles([]);
      setGalleryPreviewUrls([]);

      const mainInput = document.getElementById('main-image-input') as HTMLInputElement;
      const galleryInput = document.getElementById('gallery-input') as HTMLInputElement;
      if (mainInput) mainInput.value = '';
      if (galleryInput) galleryInput.value = '';

      fetchProducts();
    } catch (err) {
      console.error('=== Failed to add product ===');
      console.error('Error:', err);
      setMessage(`Failed to add product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage('Product deleted');
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      setMessage('Failed to delete product');
    }
  };

  const handleToggleCategoryVisibility = async (categoryId: string, currentIsHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_hidden: !currentIsHidden })
        .eq('id', categoryId);

      if (error) throw error;

      setMessage(`Category ${!currentIsHidden ? 'hidden' : 'visible'}`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to toggle category visibility:', err);
      setMessage('Failed to toggle category visibility');
    }
  };

  const handleMoveProduct = async (productId: string, newCategorySlug: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ category: newCategorySlug })
        .eq('id', productId);

      if (error) throw error;

      setMessage('Product moved successfully');
      fetchProducts();
    } catch (err) {
      console.error('Failed to move product:', err);
      setMessage('Failed to move product');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const name = newCategoryName.trim().toUpperCase();
    const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');

    const { data, error } = await supabase.from('categories')
      .insert([{ name, slug }])
      .select();

    if (error) {
      alert('Error adding category: ' + error.message);
    } else {
      setNewCategoryName('');
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string, slug: string) => {
    const productsInCategory = products.filter(p => {
      const productCategory = (p.category || '').toLowerCase().trim();
      const categorySlug = (slug || '').toLowerCase().trim();
      return productCategory === categorySlug;
    });

    if (productsInCategory.length > 0) {
      setMessage(`Cannot delete category with ${productsInCategory.length} products. Delete products first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage('Category deleted');
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setMessage('Failed to delete category');
    }
  };

  const handleMoveCategoryUp = async (index: number) => {
    if (index === 0) return;

    const current = categories[index];
    const previous = categories[index - 1];

    try {
      await supabase
        .from('categories')
        .update({ display_order: previous.display_order })
        .eq('id', current.id);

      await supabase
        .from('categories')
        .update({ display_order: current.display_order })
        .eq('id', previous.id);

      fetchCategories();
    } catch (err) {
      console.error('Failed to reorder categories:', err);
      setMessage('Failed to reorder categories');
    }
  };

  const handleMoveCategoryDown = async (index: number) => {
    if (index === categories.length - 1) return;

    const current = categories[index];
    const next = categories[index + 1];

    try {
      await supabase
        .from('categories')
        .update({ display_order: next.display_order })
        .eq('id', current.id);

      await supabase
        .from('categories')
        .update({ display_order: current.display_order })
        .eq('id', next.id);

      fetchCategories();
    } catch (err) {
      console.error('Failed to reorder categories:', err);
      setMessage('Failed to reorder categories');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditCategoryData({
      name: category.name,
      filter_type: category.filter_type,
      included_categories: category.included_categories || [],
    });
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryId) return;

    try {
      const slug = editCategoryData.name.trim().toLowerCase().replace(/\s+/g, '-');

      const { error } = await supabase
        .from('categories')
        .update({
          name: editCategoryData.name.trim().toUpperCase(),
          slug: slug,
          filter_type: editCategoryData.filter_type,
          included_categories: editCategoryData.filter_type === 'MIX' ? editCategoryData.included_categories : null,
        })
        .eq('id', editingCategoryId);

      if (error) throw error;

      setMessage('Category updated successfully');
      setEditingCategoryId(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to update category:', err);
      setMessage('Failed to update category');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditCategoryData({
      name: '',
      filter_type: 'SINGLE',
      included_categories: [],
    });
  };

  const toggleIncludedCategory = (categoryName: string) => {
    setEditCategoryData(prev => {
      const included = prev.included_categories || [];
      if (included.includes(categoryName)) {
        return {
          ...prev,
          included_categories: included.filter(c => c !== categoryName),
        };
      } else {
        return {
          ...prev,
          included_categories: [...included, categoryName],
        };
      }
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (authLoading) {
    return (
      <div className="flex h-screen bg-[#09090b] items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-700 font-mono text-sm mb-2">AUTHENTICATING...</div>
          <div className="text-zinc-800 font-mono text-xs">VERIFYING_CREDENTIALS</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const groupedProducts = categories.map(category => {
    const items = products.filter(p => {
      const productCategory = (p.category || '').toLowerCase().trim();
      const categorySlug = (category.slug || '').toLowerCase().trim();
      const matches = productCategory === categorySlug;

      if (!matches && productCategory && categorySlug) {
        console.log('Category mismatch:', {
          product: p.name,
          productCategory,
          categorySlug,
          rawProduct: p.category,
          rawCategory: category.slug
        });
      }

      return matches;
    });

    return {
      ...category,
      items
    };
  });

  console.log('Grouped products:', groupedProducts.map(g => ({
    category: g.name,
    slug: g.slug,
    count: g.items.length,
    items: g.items.map(i => i.name)
  })));

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'products'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package size={20} />
            <span className="font-medium">Product Management</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'inventory'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <List size={20} />
            <span className="font-medium">All Products</span>
          </button>

          <button
            onClick={() => setActiveTab('mainpage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'mainpage'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home size={20} />
            <span className="font-medium">Main Page</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Site Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users size={20} />
            <span className="font-medium">Users</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {message && (
            <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500 mb-2">Total Products</div>
                  <div className="text-3xl font-bold text-gray-800">{products.length}</div>
                </div>
                {categories.map(category => (
                  <div key={category.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500 mb-2">{category.name}</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {products.filter(p => {
                        const productCategory = (p.category || '').toLowerCase().trim();
                        const categorySlug = (category.slug || '').toLowerCase().trim();
                        return productCategory === categorySlug;
                      }).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Product Management</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Category & Product List */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Category / Product List</h3>

                  {/* Add Category Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add New Category</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCategory();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddCategory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-gray-500 text-sm">Loading...</div>
                  ) : groupedProducts.length === 0 ? (
                    <div className="text-gray-500 text-sm">No categories yet</div>
                  ) : (
                    <div className="space-y-4">
                      {groupedProducts.map((category, index) => (
                        <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                          {editingCategoryId === category.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                                <input
                                  type="text"
                                  value={editCategoryData.name}
                                  onChange={(e) => setEditCategoryData(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Mode</label>
                                <select
                                  value={editCategoryData.filter_type}
                                  onChange={(e) => setEditCategoryData(prev => ({ ...prev, filter_type: e.target.value as 'SINGLE' | 'ALL' | 'MIX' }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                  <option value="SINGLE">SINGLE - Show this category only</option>
                                  <option value="ALL">ALL - Show all products</option>
                                  <option value="MIX">MIX - Combine multiple categories</option>
                                </select>
                              </div>

                              {editCategoryData.filter_type === 'MIX' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Included Categories
                                  </label>
                                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                    {categories.filter(c => c.id !== category.id).map(cat => (
                                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={editCategoryData.included_categories?.includes(cat.name) || false}
                                          onChange={() => toggleIncludedCategory(cat.name)}
                                          className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">{cat.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveCategory}
                                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Save size={16} />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => handleMoveCategoryUp(index)}
                                      disabled={index === 0}
                                      className={`p-1 rounded transition-colors ${
                                        index === 0
                                          ? 'text-gray-300 cursor-not-allowed'
                                          : 'text-gray-600 hover:bg-gray-200'
                                      }`}
                                      title="Move Up"
                                    >
                                      <ChevronUp size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleMoveCategoryDown(index)}
                                      disabled={index === categories.length - 1}
                                      className={`p-1 rounded transition-colors ${
                                        index === categories.length - 1
                                          ? 'text-gray-300 cursor-not-allowed'
                                          : 'text-gray-600 hover:bg-gray-200'
                                      }`}
                                      title="Move Down"
                                    >
                                      <ChevronDown size={16} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleToggleCategoryVisibility(category.id, category.is_hidden)}
                                    className={`p-1.5 rounded transition-colors ${
                                      category.is_hidden
                                        ? 'text-gray-400 hover:bg-gray-100'
                                        : 'text-green-600 hover:bg-green-50'
                                    }`}
                                    title={category.is_hidden ? 'Category Hidden - Click to Show' : 'Category Visible - Click to Hide'}
                                  >
                                    {category.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                  <div>
                                    <h4 className={`font-semibold ${category.is_hidden ? 'text-gray-400' : 'text-gray-700'}`}>
                                      {category.name}
                                      {category.is_hidden && <span className="ml-2 text-xs">(Hidden)</span>}
                                    </h4>
                                    <div className="text-xs text-gray-500">
                                      {category.filter_type === 'ALL' && 'Shows all products'}
                                      {category.filter_type === 'SINGLE' && 'Standard category'}
                                      {category.filter_type === 'MIX' && `Mix: ${category.included_categories?.join(', ') || 'None'}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditCategory(category)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit Category"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(category.id, category.slug)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Category"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              {category.items.length === 0 ? (
                                <div className="text-sm text-gray-400 italic">No products in this category</div>
                              ) : (
                                <div className="space-y-2">
                                  {category.items.map(product => (
                                    <div
                                      key={product.id}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        {product.image && (
                                          <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-10 h-10 object-cover rounded"
                                          />
                                        )}
                                        <div>
                                          <div className="text-sm font-medium text-gray-800">{product.name}</div>
                                          <div className="text-xs text-gray-500">₩{product.price.toLocaleString()}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {movingProductId === product.id ? (
                                          <div className="flex items-center gap-2">
                                            <select
                                              onChange={(e) => {
                                                if (e.target.value) {
                                                  handleMoveProduct(product.id, e.target.value);
                                                  setMovingProductId(null);
                                                }
                                              }}
                                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                              autoFocus
                                            >
                                              <option value="">Select category...</option>
                                              {categories
                                                .filter(c => c.slug !== product.category)
                                                .map(cat => (
                                                  <option key={cat.id} value={cat.slug}>
                                                    {cat.name}
                                                  </option>
                                                ))}
                                            </select>
                                            <button
                                              onClick={() => setMovingProductId(null)}
                                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                              title="Cancel"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => setMovingProductId(product.id)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Move to Category"
                                          >
                                            <FolderInput size={16} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteProduct(product.id)}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Product Registration Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Registration / Details</h3>

                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter product name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      >
                        {categories.length === 0 ? (
                          <option value="">No categories available</option>
                        ) : (
                          categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>
                              {cat.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₩)</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter product description"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_best}
                          onChange={(e) => setFormData({ ...formData, is_best: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Best Seller</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_new}
                          onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">New Arrival</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Main Product Image (Thumbnail)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        This image will be used in product list and canvas
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="hidden"
                        id="main-image-input"
                      />
                      <label
                        htmlFor="main-image-input"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        <Upload size={18} />
                        Upload Main Image
                      </label>

                      {mainImagePreviewUrl && (
                        <div className="mt-3 relative inline-block">
                          <img
                            src={mainImagePreviewUrl}
                            alt="Main Preview"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={removeMainImage}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gallery Images (Detail View)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Additional images shown in product detail/description area
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFilesChange}
                        className="hidden"
                        id="gallery-input"
                      />
                      <label
                        htmlFor="gallery-input"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors"
                      >
                        <Upload size={18} />
                        Upload Gallery Images (Multiple)
                      </label>

                      {galleryPreviewUrls.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">
                            {galleryPreviewUrls.length} gallery image(s) selected
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {galleryPreviewUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Gallery ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeGalleryImage(index)}
                                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {uploading ? 'Uploading...' : 'Register'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const firstCategory = categories.length > 0 ? categories[0].slug : '';
                          setFormData({ name: '', category: firstCategory, price: '', description: '', is_best: false, is_new: false });
                          setMainImageFile(null);
                          setMainImagePreviewUrl('');
                          setGalleryFiles([]);
                          setGalleryPreviewUrls([]);
                          const mainInput = document.getElementById('main-image-input') as HTMLInputElement;
                          const galleryInput = document.getElementById('gallery-input') as HTMLInputElement;
                          if (mainInput) mainInput.value = '';
                          if (galleryInput) galleryInput.value = '';
                        }}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mainpage' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Main Page Builder</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <MainPageManager />
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-lg shadow p-6">
              <ProductInventory />
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Site Settings</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <SiteSettingsForm />
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profiles.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      profiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {profile.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                profile.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {profile.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(profile.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
